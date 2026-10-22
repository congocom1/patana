import { IsEnum, IsString, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PropertyType {
  HOTEL = 'hotel',
  APARTMENT = 'apartment',
}

export enum UnitStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class CreatePropertyDto {
  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTMENT })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiProperty({ example: 'Cozy Downtown Apartment' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: '123 Main St, San Francisco, CA 94102' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'A beautiful apartment in the heart of the city', required: false })
  @IsString()
  @MaxLength(3000)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsUrl()
  @MaxLength(1000)
  @IsOptional()
  imageUrl?: string;
}

export class CreateUnitDto {
  @ApiProperty({ example: 'uuid-of-property' })
  @IsString()
  propertyId!: string;

  @ApiProperty({ example: 'Deluxe Suite' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 4 })
  @IsOptional()
  capacity?: number;

  @ApiProperty({ example: 250.00 })
  @IsOptional()
  pricePerNight?: number;

  @ApiProperty({ enum: UnitStatus, example: UnitStatus.ACTIVE, required: false })
  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;
}

export class PropertyQueryDto {
  @ApiProperty({ example: 'San Francisco', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;
}

export class PropertyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ enum: PropertyType })
  type!: PropertyType;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ type: () => UnitResponseDto, isArray: true })
  units!: UnitResponseDto[];
}

export class UnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  pricePerNight!: number;

  @ApiProperty({ enum: UnitStatus })
  status!: UnitStatus;
}