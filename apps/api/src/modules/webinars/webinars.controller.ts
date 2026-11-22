import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WebinarsService } from './webinars.service';
import { CreateWebinarDto } from './dto/create-webinar.dto';
import { QueryWebinarsDto } from './dto/query-webinars.dto';
import { QueryAttendeesDto } from './dto/query-attendees.dto';
import { ImportAttendeesDto } from './dto/import-attendees.dto';
import { UpdateWebinarStatusDto } from './dto/update-webinar-status.dto';

@ApiTags('Webinars (وبینار)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webinars')
export class WebinarsController {
  constructor(private readonly webinarsService: WebinarsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست وبینارها (سند محصول ص ۱۷)' })
  @ApiResponse({ status: 200, description: 'فهرست با موفقیت دریافت شد' })
  async findAll(@Query() query: QueryWebinarsDto, @Request() req: any) {
    return this.webinarsService.findAll(query, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'ساخت وبینار جدید (پیش‌نویس اولیه - ص ۱۷)' })
  @ApiResponse({ status: 201, description: 'وبینار ایجاد شد' })
  async create(@Body() dto: CreateWebinarDto, @Request() req: any) {
    return this.webinarsService.create(dto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات ۴ تب وبینار: اطلاعات، فانل، تجهیزات، تسک‌ها (ص ۱۸)' })
  @ApiResponse({ status: 200, description: 'جزئیات وبینار' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.webinarsService.findOne(id, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت یا فرآیند انتشار وبینار (ص ۱۸)' })
  @ApiResponse({ status: 200, description: 'وضعیت وبینار بروزرسانی شد' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWebinarStatusDto,
    @Request() req: any,
  ) {
    return this.webinarsService.updateStatus(id, dto, req.user);
  }

  @Get(':id/attendees')
  @ApiOperation({ summary: 'جدول شرکت‌کنندگان وبینار با ماسک شماره و فیلتر حضور/لید (ص ۱۸)' })
  @ApiResponse({ status: 200, description: 'لیست شرکت‌کنندگان' })
  async findAttendees(
    @Param('id') id: string,
    @Query() query: QueryAttendeesDto,
    @Request() req: any,
  ) {
    return this.webinarsService.findAttendees(id, query, req.user);
  }

  @Post(':id/import-attendees')
  @ApiOperation({ summary: 'اکشن ۱: ایمپورت فایل ثبت‌نام و حضور (ص ۱۸)' })
  @ApiResponse({ status: 200, description: 'شرکت‌کنندگان با موفقیت ایمپورت/بروزرسانی شدند' })
  async importAttendees(
    @Param('id') id: string,
    @Body() dto: ImportAttendeesDto,
    @Request() req: any,
  ) {
    return this.webinarsService.importAttendees(id, dto, req.user);
  }

  @Post(':id/convert-attendees/preview')
  @ApiOperation({ summary: 'اکشن ۲-الف: پیش‌نمایش تبدیل حاضران به لید' })
  @ApiResponse({ status: 200, description: 'پیش‌نمایش لیدهای واجد شرایط و تکراری' })
  async convertAttendeesPreview(@Param('id') id: string, @Request() req: any) {
    return this.webinarsService.convertAttendeesPreview(id, req.user);
  }

  @Post(':id/convert-attendees/confirm')
  @ApiOperation({ summary: 'اکشن ۲-ب: تایید و ساخت تراکنشی لیدها از حاضران وبینار' })
  @ApiResponse({ status: 200, description: 'لیدها با موفقیت ایجاد شدند' })
  async convertAttendeesConfirm(@Param('id') id: string, @Request() req: any) {
    return this.webinarsService.convertAttendeesConfirm(id, req.user);
  }

  @Post(':id/equipment')
  @ApiOperation({ summary: 'اتصال تجهیزات به رویداد/وبینار (تب ۳ - ص ۱۸)' })
  @ApiResponse({ status: 201, description: 'تجهیز مورد نظر به وبینار متصل شد' })
  async addEquipment(
    @Param('id') id: string,
    @Body()
    body: { equipmentItemId: string; responsibleId?: string; dueDate?: string; notes?: string },
    @Request() req: any,
  ) {
    return this.webinarsService.addEquipment(id, body, req.user);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'تعریف تسک مرتبط با وبینار (تب ۴ - ص ۱۸)' })
  @ApiResponse({ status: 201, description: 'تسک مرتبط ایجاد شد' })
  async addTask(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      description?: string;
      priority?: any;
      dueDate?: string;
      assigneeId?: string;
    },
    @Request() req: any,
  ) {
    return this.webinarsService.addTask(id, body, req.user);
  }
}
