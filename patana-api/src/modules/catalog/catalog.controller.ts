import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AuthGuard, ActorRequest } from '../auth/auth.guard';
import { CreatePropertyDto, CreateUnitDto, PropertyQueryDto, PropertyResponseDto } from './dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('catalog')
@ApiBearerAuth('JWT')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('properties')
  @ApiOperation({ summary: 'Search properties by city' })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiResponse({ status: 200, type: [PropertyResponseDto] })
  properties(@Query() query: PropertyQueryDto) {
    return this.catalog.properties(query.city);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get properties owned by current user' })
  @ApiResponse({ status: 200, type: [PropertyResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  mine(@Req() req: ActorRequest) {
    return this.catalog.mine(req.actor.sub);
  }

  @Post('properties')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, type: PropertyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Owner registration required' })
  createProperty(@Req() req: ActorRequest, @Body() dto: CreatePropertyDto) {
    return this.catalog.createProperty(req.actor.sub, dto);
  }

  @Post('units')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new unit for a property' })
  @ApiResponse({ status: 201, description: 'Unit created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your property' })
  createUnit(@Req() req: ActorRequest, @Body() dto: CreateUnitDto) {
    return this.catalog.createUnit(req.actor.sub, dto);
  }
}