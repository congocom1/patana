import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuthGuard, ActorRequest } from '../auth/auth.guard';
import { OwnerGuard } from './owner.guard';
import { RegisterOwnerDto, OwnerProfileResponseDto, OwnerBookingResponseDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('owner')
@ApiBearerAuth('JWT')
@Controller('owner')
@UseGuards(AuthGuard, OwnerGuard)
export class OwnerController {
  constructor(private readonly db: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current owner profile' })
  @ApiResponse({ status: 200, type: OwnerProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Owner profile required' })
  me(@Req() req: ActorRequest) {
    return this.db.owner.findUnique({
      where: { userId: req.actor.sub },
      select: { id: true, businessName: true, verificationStatus: true },
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register or update owner profile' })
  @ApiResponse({ status: 200, type: OwnerProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid business name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async register(@Req() req: ActorRequest, @Body() dto: RegisterOwnerDto) {
    const name = dto.businessName?.trim();
    if (!name || name.length < 2 || name.length > 150) {
      throw new BadRequestException('Business name must be 2–150 characters');
    }
    return this.db.owner.upsert({
      where: { userId: req.actor.sub },
      create: { userId: req.actor.sub, businessName: name },
      update: {},
    });
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get bookings for owner properties (paginated)' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Paginated bookings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Owner profile required' })
  async bookings(
    @Req() req: ActorRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = '50',
  ) {
    const take = Math.min(Number(limit), 100);
    const where = {
      unit: { property: { owner: { userId: req.actor.sub } } },
    };
    const bookings = await this.db.booking.findMany({
      where,
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        unit: { select: { name: true, property: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });
    const hasMore = bookings.length > take;
    const items = hasMore ? bookings.slice(0, take) : bookings;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;
    return { items, nextCursor, hasMore };
  }
}