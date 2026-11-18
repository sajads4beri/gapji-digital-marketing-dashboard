import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SmsService } from './sms.service';
import { CreateSmsCampaignDto } from './dto/create-sms-campaign.dto';
import { QuerySmsCampaignsDto } from './dto/query-sms-campaigns.dto';
import { QuerySmsRecipientsDto } from './dto/query-sms-recipients.dto';
import { ImportSmsResultsDto } from './dto/import-sms-results.dto';

@ApiTags('SMS (پیامک)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  @ApiOperation({ summary: 'فهرست تاریخچه ارسال پیامک (سند محصول ص ۱۷)' })
  @ApiResponse({ status: 200, description: 'فهرست با موفقیت دریافت شد' })
  async findAll(@Query() query: QuerySmsCampaignsDto, @Request() req: any) {
    return this.smsService.findAll(query, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد کمپین پیامکی جدید یا پیش‌نویس ارسال' })
  @ApiResponse({ status: 201, description: 'کمپین پیامکی ایجاد شد' })
  async create(@Body() dto: CreateSmsCampaignDto, @Request() req: any) {
    return this.smsService.create(dto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات ارسال پیامک و خلاصه آمار تحویل/هزینه (ص ۱۷)' })
  @ApiResponse({ status: 200, description: 'جزئیات ارسال پیامک' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.smsService.findOne(id, req.user);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'جدول شماره‌ها با ماسک شماره و فیلتر وضعیت (ص ۱۷)' })
  @ApiResponse({ status: 200, description: 'لیست شماره‌ها' })
  async findRecipients(
    @Param('id') id: string,
    @Query() query: QuerySmsRecipientsDto,
    @Request() req: any,
  ) {
    return this.smsService.findRecipients(id, query, req.user);
  }

  @Post(':id/import-results')
  @ApiOperation({ summary: 'اکشن ۱: ایمپورت نتیجه ارسال (ص ۱۷)' })
  @ApiResponse({ status: 200, description: 'نتایج ارسال با موفقیت ایمپورت شد' })
  async importResults(
    @Param('id') id: string,
    @Body() dto: ImportSmsResultsDto,
    @Request() req: any,
  ) {
    return this.smsService.importResults(id, dto, req.user);
  }

  @Post(':id/convert-replies/preview')
  @ApiOperation({ summary: 'اکشن ۲-الف: پیش‌نمایش ساخت لید از پاسخ‌دهندگان' })
  @ApiResponse({ status: 200, description: 'پیش‌نمایش لیدهای واجد شرایط و تکراری' })
  async convertRepliesPreview(@Param('id') id: string, @Request() req: any) {
    return this.smsService.convertRepliesPreview(id, req.user);
  }

  @Post(':id/convert-replies/confirm')
  @ApiOperation({ summary: 'اکشن ۲-ب: تایید و ساخت تراکنشی لیدها از پاسخ‌دهندگان' })
  @ApiResponse({ status: 200, description: 'لیدها با موفقیت ایجاد شدند' })
  async convertRepliesConfirm(@Param('id') id: string, @Request() req: any) {
    return this.smsService.convertRepliesConfirm(id, req.user);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'اکشن ۳: خروجی Excel/CSV از نتایج شماره‌ها (ص ۱۷)' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Param('id') id: string, @Request() req: any, @Response() res: any) {
    const csvData = await this.smsService.exportRecipientsCsv(id, req.user);
    res.setHeader('Content-Disposition', `attachment; filename="sms_recipients_${id}.csv"`);
    res.status(HttpStatus.OK).send(csvData);
  }
}
