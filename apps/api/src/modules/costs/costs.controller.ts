import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CostsService, CurrentUserPayload } from './costs.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { CostQueryDto } from './dto/cost-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('costs')
@Controller('costs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Get()
  @ApiOperation({ summary: 'List all costs for current organization with filtering' })
  @ApiResponse({ status: 200, description: 'List of costs' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for user role' })
  findAll(@Query() query: CostQueryDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.findAll(query, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated cost statistics and dashboard breakdown' })
  @ApiResponse({ status: 200, description: 'Cost statistics summary' })
  getStats(@Query() query: any, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    const dateRange = query?.from || query?.to ? { from: query.from, to: query.to } : undefined;
    return this.costsService.getStats(dateRange, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost by ID' })
  @ApiParam({ name: 'id', description: 'Cost UUID' })
  @ApiResponse({ status: 200, description: 'Cost item details' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Cost item not found' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new advertising/marketing cost' })
  @ApiResponse({ status: 201, description: 'Cost created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for user role' })
  create(@Body() dto: CreateCostDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.create(dto, user);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch import costs' })
  @ApiResponse({ status: 201, description: 'Batch import results' })
  importBatch(@Body() items: CreateCostDto[], @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.importBatch(items, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing cost record' })
  @ApiParam({ name: 'id', description: 'Cost UUID' })
  @ApiResponse({ status: 200, description: 'Cost updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Cost item not found' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCostDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cost record' })
  @ApiParam({ name: 'id', description: 'Cost UUID' })
  @ApiResponse({ status: 200, description: 'Cost deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Cost item not found' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.costsService.remove(id, user).then(() => ({ success: true }));
  }
}
