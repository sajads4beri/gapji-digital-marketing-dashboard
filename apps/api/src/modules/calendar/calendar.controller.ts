import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CalendarService, CurrentUserPayload } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { QueryCalendarEventsDto } from './dto/query-calendar-events.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('Calendar (تقویم بازاریابی)')
@Controller(['calendar/events', 'calendar'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت فهرست رویدادهای تقویم بازاریابی با فیلتر بازه زمانی و نوع رویداد' })
  @ApiResponse({ status: 200, description: 'فهرست رویدادها با موفقیت دریافت شد' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربری' })
  async findAll(@Query() query: QueryCalendarEventsDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.calendarService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات کامل یک رویداد تقویم بر اساس شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای رویداد تقویم' })
  @ApiResponse({ status: 200, description: 'مشخصات کامل رویداد تقویم' })
  @ApiResponse({ status: 404, description: 'رویداد یافت نشد' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه رویداد تقویم نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.calendarService.findOne(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد رویداد جدید در تقویم بازاریابی سازمان' })
  @ApiResponse({ status: 201, description: 'رویداد با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کارفرما به ثبت رویداد' })
  async create(@Body() dto: CreateCalendarEventDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.calendarService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات یا جابجایی زمان‌بندی رویداد تقویم' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای رویداد تقویم' })
  @ApiResponse({ status: 200, description: 'رویداد با موفقیت ویرایش شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 404, description: 'رویداد یافت نشد' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه رویداد تقویم نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.calendarService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف رویداد از تقویم بازاریابی سازمان' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای رویداد تقویم' })
  @ApiResponse({ status: 200, description: 'رویداد با موفقیت حذف شد' })
  @ApiResponse({ status: 404, description: 'رویداد یافت نشد' })
  async delete(@Param('id') id: string, @Req() req: any) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه رویداد تقویم نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.calendarService.delete(id, user);
  }
}
