import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService, CurrentUserPayload } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preference.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی فهرست اعلان‌های کاربر جاری با فیلتر و صفحه‌بندی' })
  @ApiResponse({ status: 200, description: 'فهرست اعلان‌ها همراه با تعداد نخوانده‌ها' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  async findAll(@Query() query: NotificationQueryDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.findAll(query, user);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'واکشی سریع تعداد اعلان‌های خوانده‌نشده' })
  @ApiResponse({ status: 200, description: 'تعداد کل پیام‌های خوانده‌نشده' })
  async getUnreadCount(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.getUnreadCount(user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'علامت‌گذاری تمامی اعلان‌های کاربر به عنوان خوانده‌شده' })
  @ApiResponse({ status: 200, description: 'همه اعلان‌ها با موفقیت خوانده شدند' })
  async markAllAsRead(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'علامت‌گذاری یک اعلان مشخص به عنوان خوانده‌شده' })
  @ApiParam({ name: 'id', description: 'شناسه UUID اعلان' })
  @ApiResponse({ status: 200, description: 'اعلان خوانده شد' })
  @ApiResponse({ status: 404, description: 'اعلان یافت نشد' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.markAsRead(id, user);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'واکشی ماتریس تنظیمات کانال‌های دریافت اعلان‌ها (درون‌برنامه‌ای، ایمیل)' })
  @ApiResponse({ status: 200, description: 'تنظیمات رویدادهای شش‌گانه اعلان' })
  async getPreferences(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.getPreferences(user);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'بروزرسانی و ذخیره تنظیمات کانال‌های دریافت اعلان' })
  @ApiResponse({ status: 200, description: 'تنظیمات با موفقیت ذخیره گردید' })
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.notificationsService.updatePreferences(dto, user);
  }
}
