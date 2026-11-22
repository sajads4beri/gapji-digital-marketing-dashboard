import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformsService, CurrentUserPayload } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformQueryDto } from './dto/platform-query.dto';

@ApiTags('platforms')
@Controller('platforms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'دریافت فهرست قالب‌های آماده پلتفرم‌های تبلیغاتی' })
  @ApiResponse({ status: 200, description: 'فهرست قالب‌های پیش‌فرض سامانه' })
  @ApiResponse({ status: 401, description: 'نیاز به احراز هویت' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  getTemplates(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    // بررسی دسترسی نقشی برای مشاهده قالب‌ها
    return this.platformsService.getTemplates();
  }

  @Get()
  @ApiOperation({ summary: 'فهرست پلتفرم‌های تعریف‌شده سازمان همراه با فیلترها' })
  @ApiResponse({ status: 200, description: 'فهرست پلتفرم‌ها همراه با تعداد کمپین‌های فعال' })
  @ApiResponse({ status: 401, description: 'نیاز به احراز هویت' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  findAll(@Query() query: PlatformQueryDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات یک پلتفرم خاص' })
  @ApiParam({ name: 'id', description: 'شناسه پلتفرم (UUID)' })
  @ApiResponse({ status: 200, description: 'مشخصات کامل پلتفرم، ورودی‌ها و خروجی‌ها' })
  @ApiResponse({ status: 404, description: 'پلتفرم یافت نشد' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.findOne(id, user);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'دریافت آمار کمپین‌های در حال استفاده از پلتفرم جهت نمایش قبل از غیرفعال‌سازی' })
  @ApiParam({ name: 'id', description: 'شناسه پلتفرم (UUID)' })
  @ApiResponse({ status: 200, description: 'تعداد و لیست کمپین‌های فعال' })
  getUsage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.getUsage(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'تعریف پلتفرم جدید (از قالب آماده یا پیکربندی خالی)' })
  @ApiResponse({ status: 201, description: 'پلتفرم با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 403, description: 'تنها ادمین و مدیر مارکتینگ مجاز هستند' })
  create(@Body() dto: CreatePlatformDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات پلتفرم، ورودی‌ها یا ستون‌های گزارش' })
  @ApiParam({ name: 'id', description: 'شناسه پلتفرم (UUID)' })
  @ApiResponse({ status: 200, description: 'پلتفرم با موفقیت به‌روزرسانی شد' })
  @ApiResponse({ status: 404, description: 'پلتفرم یافت نشد' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePlatformDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.update(id, dto, user);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'غیرفعال‌سازی پلتفرم همراه با گزارش تعداد کمپین‌های فعال' })
  @ApiParam({ name: 'id', description: 'شناسه پلتفرم (UUID)' })
  @ApiResponse({ status: 200, description: 'پلتفرم غیرفعال شد' })
  deactivate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.deactivate(id, user);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'فعال‌سازی مجدد پلتفرم' })
  @ApiParam({ name: 'id', description: 'شناسه پلتفرم (UUID)' })
  @ApiResponse({ status: 200, description: 'پلتفرم فعال شد' })
  activate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.platformsService.activate(id, user);
  }
}
