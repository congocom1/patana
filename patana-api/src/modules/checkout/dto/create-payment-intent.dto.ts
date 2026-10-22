import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Booking ID to pay for' })
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ description: 'Idempotency key to prevent duplicate charges', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}