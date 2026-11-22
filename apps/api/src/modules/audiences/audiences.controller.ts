import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AudiencesService, CurrentUserPayload } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceQueryDto } from './dto/audience-query.dto';

@ApiTags('audiences')
@Controller('audiences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست مخاطبان سازمان همراه با فیلترها و شمارنده کمپین‌ها' })
  @ApiResponse({ status: 200, description: 'فهرست مخاطبان همراه با صفحه‌بندی' })
  @ApiResponse({ status: 401, description: 'نیاز به احراز هویت' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  findAll(@Query() query: AudienceQueryDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات دموگرافیک مخاطب و جدول عملکرد کمپین‌های متصل' })
  @ApiParam({ name: 'id', description: 'شناسه مخاطب (UUID)' })
  @ApiResponse({ status: 200, description: 'جزئیات مخاطب و کمپین‌های متصل با محاسبات مالی' })
  @ApiResponse({ status: 404, description: 'مخاطب یافت نشد' })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد مخاطب هدف جدید' })
  @ApiResponse({ status: 201, description: 'مخاطب جدید با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 403, description: 'تنها ادمین و مدیر مارکتینگ مجاز هستند' })
  create(@Body() dto: CreateAudienceDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.create(dto, user);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'کپی کردن مخاطب (Clone/Duplicate)' })
  @ApiParam({ name: 'id', description: 'شناسه مخاطب مبدا (UUID)' })
  @ApiResponse({ status: 201, description: 'مخاطب کپی شده ایجاد شد' })
  @ApiResponse({ status: 404, description: 'مخاطب یافت نشد' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  duplicate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.duplicate(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات مخاطب' })
  @ApiParam({ name: 'id', description: 'شناسه مخاطب (UUID)' })
  @ApiResponse({ status: 200, description: 'مخاطب با موفقیت به‌روزرسانی شد' })
  @ApiResponse({ status: 404, description: 'مخاطب یافت نشد' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAudienceDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف مخاطب (تنها در صورتی که در هیچ کمپینی استفاده نشده باشد)' })
  @ApiParam({ name: 'id', description: 'شناسه مخاطب (UUID)' })
  @ApiResponse({ status: 200, description: 'مخاطب حذف شد' })
  @ApiResponse({ status: 400, description: 'مخاطب در کمپین‌ها استفاده شده و حذف آن مجاز نیست' })
  @ApiResponse({ status: 404, description: 'مخاطب یافت نشد' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربر' })
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.audiencesService.delete(id, user);
  }
}
