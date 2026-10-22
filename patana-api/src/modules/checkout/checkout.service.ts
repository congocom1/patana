import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../shared/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe;

  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const booking = await this.db.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        unit: { include: { property: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customer.userId !== userId) {
      throw new BadRequestException('Not your booking');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException(`Booking is ${booking.status}, cannot pay`);
    }

    if (dto.idempotencyKey) {
      const existingPayment = await this.db.payment.findFirst({
        where: { providerReference: dto.idempotencyKey },
      });
      if (existingPayment) {
        const intent = await this.stripe.paymentIntents.retrieve(existingPayment.providerReference!);
        return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
      }
    }

    const existingPending = await this.db.payment.findFirst({
      where: { bookingId: dto.bookingId, status: 'pending' },
    });
    if (existingPending?.providerReference) {
      const intent = await this.stripe.paymentIntents.retrieve(existingPending.providerReference);
      if (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation') {
        return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
      }
    }

    const amountCents = Math.round(Number(booking.totalPrice) * 100);
    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        metadata: {
          bookingId: booking.id,
          userId,
          propertyName: booking.unit.property.name,
          unitName: booking.unit.name,
        },
        automatic_payment_methods: { enabled: true },
      },
      dto.idempotencyKey ? { idempotencyKey: dto.idempotencyKey } : undefined,
    );

    await this.db.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: 'stripe',
        providerReference: paymentIntent.id,
        status: 'pending',
      },
    });

    return { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const { bookingId } = paymentIntent.metadata;
    if (!bookingId) return;

    await this.db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { providerReference: paymentIntent.id },
        data: { status: 'succeeded', paidAt: new Date() },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed' },
      });

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true },
      });
      if (booking?.customer) {
        await tx.notification.create({
          data: {
            userId: booking.customer.userId,
            type: 'booking_confirmed',
            title: 'Booking Confirmed',
            message: `Your booking for ${paymentIntent.metadata.propertyName} - ${paymentIntent.metadata.unitName} has been confirmed.`,
          },
        });
      }
    });
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    await this.db.payment.update({
      where: { providerReference: paymentIntent.id },
      data: { status: 'failed' },
    });

    const { bookingId, userId } = paymentIntent.metadata;
    if (userId) {
      await this.db.notification.create({
        data: {
          userId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Payment for booking ${bookingId} failed. Please try again.`,
        },
      });
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    await this.db.payment.update({
      where: { providerReference: paymentIntent.id },
      data: { status: 'canceled' },
    });
  }

  async manualConfirmBooking(bookingId: string) {
    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'pending') throw new BadRequestException('Booking not pending');

    return this.db.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' },
    });
  }
}