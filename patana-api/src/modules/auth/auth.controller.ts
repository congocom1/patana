import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard, ActorRequest } from './auth.guard';
import { RegisterDto, LoginDto, RefreshDto, LogoutDto, AuthResponseDto, MeResponseDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('auth')
@ApiBearerAuth('JWT')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and get access + refresh tokens' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.login(dto, req.headers['user-agent'], req.ip);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.refresh(dto.refreshToken, req.headers['user-agent'], req.ip);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Logout (revoke specific refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  logout(@Body() dto: LogoutDto): Promise<void> {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Logout from all devices (revoke all refresh tokens)' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  logoutAll(@Req() req: ActorRequest): Promise<void> {
    return this.auth.logoutAll(req.actor.sub);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@Req() req: ActorRequest): Promise<MeResponseDto> {
    return this.auth.me(req.actor.sub);
  }
}
