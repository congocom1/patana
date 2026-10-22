import { BadRequestException, Body, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, ActorRequest } from '../auth/auth.guard';
import { CheckoutService } from './checkout.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import type { Request } from 'express';

@ApiTags('checkout')
@ApiBearerAuth('JWT')
@Controller('checkout')
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('payment-intent')
  @ApiOperation({ summary: 'Create a Stripe PaymentIntent for a booking' })
  @ApiResponse({ status: 201, description: 'PaymentIntent created', schema: { example: { clientSecret: 'pi_xxx_secret_yyy', paymentIntentId: 'pi_xxx' } } })
  @ApiResponse({ status: 400, description: 'Invalid booking or not pending' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createPaymentIntent(@Req() req: ActorRequest, @Body() dto: CreatePaymentIntentDto) {
    return this.checkout.createPaymentIntent(req.actor.sub, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (no auth required)' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.checkout.handleWebhook(req.rawBody!, signature);
  }

  @Post('confirm/:bookingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually confirm booking (admin/recovery)' })
  async manualConfirm(@Req() req: ActorRequest, @Headers('x-admin-key') adminKey: string) {
    if (adminKey !== process.env.ADMIN_WEBHOOK_KEY) {
      throw new BadRequestException('Invalid admin key');
    }
    return { message: 'Use manualConfirmBooking service method directly' };
  }
}