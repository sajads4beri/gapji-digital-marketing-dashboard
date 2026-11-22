import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService, CurrentUserPayload, DashboardDataPayload } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated executive dashboard metrics and KPIs' })
  @ApiResponse({ status: 200, description: 'Executive dashboard payload' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized role' })
  getOverview(
    @Query() query: DashboardQueryDto,
    @Req() req: any,
  ): Promise<DashboardDataPayload> {
    const user = req.user as CurrentUserPayload;
    return this.dashboardService.getOverview(query, user);
  }

  @Get()
  @ApiOperation({ summary: 'Alias for dashboard overview' })
  @ApiResponse({ status: 200, description: 'Executive dashboard payload' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized role' })
  getRoot(
    @Query() query: DashboardQueryDto,
    @Req() req: any,
  ): Promise<DashboardDataPayload> {
    const user = req.user as CurrentUserPayload;
    return this.dashboardService.getOverview(query, user);
  }
}
