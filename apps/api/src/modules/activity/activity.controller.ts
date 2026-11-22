import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ActivityService } from './activity.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { LogActivityDto } from './dto/log-activity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('activity')
@Controller('activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی لاگ‌های رویداد و فعالیت سازمان با فیلتر و صفحه‌بندی' })
  @ApiResponse({ status: 200, description: 'فهرست لاگ‌های رویداد' })
  async findAll(@Query() query: QueryActivityDto, @Req() req: any) {
    return this.activityService.findAll(req.user, query);
  }

  @Get('team-summary')
  @ApiOperation({ summary: 'دریافت گزارش تجمیعی فعالیت تیم و اعضا' })
  @ApiResponse({ status: 200, description: 'گزارش تجمیعی' })
  async getSummary(@Req() req: any) {
    return this.activityService.getTeamSummary(req.user);
  }

  @Get('export')
  @ApiOperation({ summary: 'خروجی اکسل و CSV گزارش فعالیت‌ها با انکودینگ UTF-8' })
  async exportCsv(
    @Query() query: QueryActivityDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const csvData = await this.activityService.exportCsv(req.user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"');
    return res.send(csvData);
  }

  @Post('log')
  @ApiOperation({ summary: 'ثبت رویداد جدید به صورت دستی یا سیستمی' })
  @ApiResponse({ status: 201, description: 'رویداد با موفقیت ثبت شد' })
  async log(@Body() dto: LogActivityDto, @Req() req: any) {
    return this.activityService.log(req.user, dto, {
      ipAddress: req.ip,
      userAgent: req.headers ? req.headers['user-agent'] : undefined,
    });
  }
}
