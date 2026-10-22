import { IsString, MinLength, MaxLength, IsNumber, Min, Max, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterOwnerDto {
  @ApiProperty({ example: 'Acme Hospitality Group' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  businessName!: string;
}

export class OwnerProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  businessName!: string;

  @ApiProperty()
  verificationStatus!: string;
}

export class OwnerBookingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  checkIn!: string;

  @ApiProperty()
  checkOut!: string;

  @ApiProperty()
  guests!: number;

  @ApiProperty()
  totalPrice!: string;

  @ApiProperty()
  unit!: {
    name: string;
    property: { name: string };
  };
}