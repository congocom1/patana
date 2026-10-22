import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/prisma.service';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  private hash(password: string) {
    const salt = randomBytes(16).toString('hex');
    return salt + ':' + scryptSync(password, salt, 64).toString('hex');
  }

  private matches(password: string, stored: string) {
    const [salt, digest] = stored.split(':');
    if (!salt || !digest || digest.length !== 128) return false;
    return timingSafeEqual(Buffer.from(digest, 'hex'), scryptSync(password, salt, 64));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateAccessToken(id: string, role: string) {
    return this.jwt.sign({ sub: id, role }, { expiresIn: '15m' });
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private async createRefreshToken(
    userId: string,
    expiresInDays = 7,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const token = this.generateRefreshToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.db.refreshToken.create({
      data: { userId, tokenHash, userAgent, ipAddress, expiresAt },
    });

    return token;
  }

  async register(input: { email: string; fullName: string; password: string }) {
    const email = input.email?.trim().toLowerCase();
    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !input.fullName?.trim() ||
      !input.password ||
      input.password.length < 12 ||
      input.password.length > 128
    ) {
      throw new BadRequestException(
        'Valid name, email and password of 12–128 characters are required',
      );
    }
    if (await this.db.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email already registered');
    }
    try {
      const user = await this.db.user.create({
        data: {
          email,
          fullName: input.fullName.trim(),
          passwordHash: this.hash(input.password),
          role: 'customer',
        },
      });
      const accessToken = this.generateAccessToken(user.id, user.role);
      const refreshToken = await this.createRefreshToken(user.id);
      return { accessToken, refreshToken, tokenType: 'Bearer' };
    } catch (error) {
      throw new ConflictException('Account could not be created');
    }
  }

  async login(input: { email: string; password: string }, userAgent?: string, ipAddress?: string) {
    const user = await this.db.user.findUnique({
      where: { email: input.email?.trim().toLowerCase() || '' },
    });
    if (!user?.passwordHash || !input.password || !this.matches(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id, 7, userAgent, ipAddress);
    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.db.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the used token (rotation)
    await this.db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Create new refresh token
    const newRefreshToken = await this.createRefreshToken(stored.userId, 7, userAgent, ipAddress);
    const user = await this.db.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = this.generateAccessToken(user.id, user.role);
    return { accessToken, refreshToken: newRefreshToken, tokenType: 'Bearer' };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.db.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
