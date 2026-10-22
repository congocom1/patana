import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const request = z.object({
  unitId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(100),
}).strict();

const day = (s: string) => new Date(s + 'T00:00:00.000Z');
const dateKey = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class BookingService {
  constructor(private readonly db: PrismaService) {}

  async mine(userId: string) {
    const bookings = await this.db.booking.findMany({
      where: { customer: { userId } },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalPrice: true,
        status: true,
        unit: { select: { name: true, property: { select: { name: true, city: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => ({
      ...b,
      totalPrice: b.totalPrice.toString(),
    }));
  }

  async create(userId: string, payload: unknown) {
    const parsed = request.safeParse(payload);
    if (!parsed.success) throw new BadRequestException('Invalid booking request');

    const { unitId, checkIn, checkOut, guests } = parsed.data;
    const start = day(checkIn);
    const end = day(checkOut);
    const nights = Math.round((end.getTime() - start.getTime()) / 86400000);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      dateKey(start) !== checkIn ||
      dateKey(end) !== checkOut ||
      start < day(new Date().toISOString().slice(0, 10)) ||
      nights < 1 ||
      nights > 365
    ) {
      throw new BadRequestException('Select a valid future stay between 1 and 365 nights');
    }

    return this.db.$transaction(async (tx) => {
      // Advisory transaction lock serializes booking attempts for the same unit across API instances.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${unitId}::text, 0))`;
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });
      if (!unit || unit.status !== 'active') throw new NotFoundException('Unit unavailable');
      if (guests > unit.capacity) throw new BadRequestException('Too many guests');

      const conflicting = await tx.booking.count({
        where: { unitId, status: { in: ['pending', 'confirmed'] }, checkIn: { lt: end }, checkOut: { gt: start } },
      });
      if (conflicting) throw new ConflictException('These dates are already reserved');

      const calendar = await tx.availability.findMany({ where: { unitId, date: { gte: start, lt: end } } });
      if (calendar.some((a) => !a.isAvailable)) throw new ConflictException('One or more nights are blocked');

      const overrides = new Map(calendar.map((a) => [dateKey(a.date), a.priceOverride]));
      let total = new Prisma.Decimal(0);
      for (let i = 0; i < nights; i++) {
        const date = new Date(start.getTime() + i * 86400000);
        const override = overrides.get(dateKey(date));
        const price = override ?? unit.pricePerNight;
        if (price.lte(0)) throw new BadRequestException('Invalid unit price');
        total = total.plus(price);
      }

      const customer = await tx.customer.upsert({ where: { userId }, create: { userId }, update: {} });
      const booking = await tx.booking.create({
        data: { unitId, customerId: customer.id, checkIn: start, checkOut: end, guests, status: 'pending', totalPrice: total },
      });

      return {
        id: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice.toString(),
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        unit: { name: unit.name, property: { name: unit.property?.name ?? '', city: unit.property?.city ?? '' } },
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 12000 });
  }
}
