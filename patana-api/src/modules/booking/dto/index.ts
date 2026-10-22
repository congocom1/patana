import { IsUUID, IsString, IsNumber, Min, Max, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-unit' })
  @IsUUID()
  unitId!: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDate()
  checkIn!: Date;

  @ApiProperty({ example: '2025-06-20' })
  @IsDate()
  checkOut!: Date;

  @ApiProperty({ example: 2, minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  guests!: number;
}

export class BookingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  @IsDate()
  checkIn!: Date;

  @ApiProperty()
  @IsDate()
  checkOut!: Date;

  @ApiProperty()
  guests!: number;

  @ApiProperty()
  totalPrice!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  unit!: {
    name: string;
    property: { name: string; city: string };
  };
}

export class MyBookingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  @IsDate()
  checkIn!: Date;

  @ApiProperty()
  @IsDate()
  checkOut!: Date;

  @ApiProperty()
  guests!: number;

  @ApiProperty()
  totalPrice!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  unit!: { name: string; property: { name: string; city: string } };
}