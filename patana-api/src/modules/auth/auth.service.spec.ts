import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../shared/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      customer: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('access-token'),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', role: 'customer' }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const validInput = { email: 'test@example.com', fullName: 'Test User', password: 'password123456' };

    it('should create user and return tokens', async () => {
      prismaMock.user.create.mockResolvedValue({ id: 'user-1', email: validInput.email, fullName: validInput.fullName, role: 'customer' });
      prismaMock.refreshToken.create.mockResolvedValue({ tokenHash: 'hash', expiresAt: new Date() });

      const result = await service.register(validInput);

      expect(result).toEqual({ accessToken: 'access-token', refreshToken: expect.any(String), tokenType: 'Bearer' });
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.register(validInput)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid email', async () => {
      await expect(service.register({ ...validInput, email: 'invalid' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      await expect(service.register({ ...validInput, password: 'short' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const input = { email: 'test@example.com', password: 'password123456' };
    const hashedPassword = 'salt:digest';

    it('should return tokens for valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: hashedPassword, role: 'customer' });
      jest.spyOn(service as any, 'matches').mockReturnValue(true);
      prismaMock.refreshToken.create.mockResolvedValue({ tokenHash: 'hash', expiresAt: new Date() });

      const result = await service.login(input);

      expect(result).toEqual({ accessToken: 'access-token', refreshToken: expect.any(String), tokenType: 'Bearer' });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: hashedPassword, role: 'customer' });
      jest.spyOn(service as any, 'matches').mockReturnValue(false);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and return new pair', async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenHash = 'sha256-hash';

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      });
      prismaMock.refreshToken.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({ tokenHash: 'new-hash', expiresAt: new Date() });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'customer' });

      const result = await service.refresh(refreshToken);

      expect(result).toEqual({ accessToken: 'access-token', refreshToken: expect.any(String), tokenType: 'Bearer' });
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({ where: { id: 'token-1' }, data: { revokedAt: expect.any(Date) } });
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(),
      });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 86400000),
        revokedAt: null,
      });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the provided refresh token', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('refresh-token');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String) },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('logoutAll', () => {
    it('should revoke all active refresh tokens for user', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await service.logoutAll('user-1');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});