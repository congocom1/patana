import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, ActorRequest } from '../auth/auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto, BookingResponseDto, MyBookingResponseDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('bookings')
@ApiBearerAuth('JWT')
@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({ status: 200, type: [MyBookingResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  mine(@Req() req: ActorRequest): Promise<MyBookingResponseDto[]> {
    return this.booking.mine(req.actor.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new booking request' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid booking request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 409, description: 'Dates already reserved or blocked' })
  create(@Req() req: ActorRequest, @Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.booking.create(req.actor.sub, dto);
  }
}