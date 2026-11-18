import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
import { KpisService, CurrentUserPayload } from './kpis.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { CreateCustomMetricDto } from './dto/create-custom-metric.dto';
import { ValidateFormulaDto } from './dto/validate-formula.dto';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';

@ApiTags('kpis')
@Controller('kpis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  // ==============================================================================
  // METRICS & FORMULA ENDPOINTS (Placed before :id routes)
  // ==============================================================================

  @Get('metrics')
  @ApiOperation({ summary: 'فهرست شاخص‌های پیش‌فرض سیستم و شاخص‌های اختصاصی سازمان (تب ۲)' })
  @ApiResponse({ status: 200, description: 'فهرست شاخص‌ها همراه با فرمول و برچسب پیش‌فرض' })
  findAllMetrics(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.findAllMetrics(user);
  }

  @Post('metrics/custom')
  @ApiOperation({ summary: 'ایجاد شاخص اختصاصی جدید با فرمول محاسباتی امن' })
  @ApiResponse({ status: 201, description: 'شاخص اختصاصی جدید ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای نحوی فرمول یا کد تکراری' })
  @ApiResponse({ status: 403, description: 'تنها ادمین و مدیر مارکتینگ مجاز هستند' })
  createCustomMetric(@Body() dto: CreateCustomMetricDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.createCustomMetric(dto, user);
  }

  @Delete('metrics/custom/:id')
  @ApiOperation({ summary: 'حذف شاخص اختصاصی سازمان' })
  @ApiParam({ name: 'id', description: 'شناسه شاخص اختصاصی (UUID)' })
  @ApiResponse({ status: 200, description: 'شاخص با موفقیت حذف شد' })
  @ApiResponse({ status: 400, description: 'شاخص در یک یا چند KPI فعال استفاده شده است' })
  @ApiResponse({ status: 404, description: 'شاخص یافت نشد' })
  deleteCustomMetric(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.deleteCustomMetric(id, user);
  }

  @Post('formula/validate')
  @ApiOperation({ summary: 'اعتبارسنجی نحوی فرمول و استخراج متغیرهای آن بدون اجرای کد' })
  @ApiResponse({ status: 200, description: 'نتیجه اعتبارسنجی و پیام خطای فارسی' })
  validateFormula(@Body() dto: ValidateFormulaDto) {
    return this.kpisService.validateFormula(dto);
  }

  @Post('formula/preview')
  @ApiOperation({ summary: 'پیش‌نمایش زنده محاسبه فرمول بر روی داده‌های واقعی کمپین یا سازمان' })
  @ApiResponse({ status: 200, description: 'مقدار محاسبه‌شده فرمول همراه با مقادیر متغیرها' })
  @ApiResponse({ status: 400, description: 'خطای نحوی در فرمول' })
  previewFormula(@Body() dto: ValidateFormulaDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.previewFormula(dto, user);
  }

  // ==============================================================================
  // ALERT RULES ENDPOINTS (Placed before :id routes)
  // ==============================================================================

  @Get('alerts')
  @ApiOperation({ summary: 'فهرست قواعد هشدار تعریف‌شده (تب ۳: جمله‌ساز قواعد)' })
  @ApiResponse({ status: 200, description: 'فهرست قواعد همراه با وضعیت تحریک زنده' })
  findAllAlertRules(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.findAllAlertRules(user);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'ایجاد قاعده هشدار جدید بر اساس ساختار جمله‌ای PRD' })
  @ApiResponse({ status: 201, description: 'قاعده هشدار با موفقیت ایجاد شد' })
  @ApiResponse({ status: 403, description: 'تنها مدیر مارکتینگ و ادمین مجاز هستند' })
  createAlertRule(@Body() dto: CreateAlertRuleDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.createAlertRule(dto, user);
  }

  @Patch('alerts/:id')
  @ApiOperation({ summary: 'ویرایش قاعده هشدار' })
  @ApiParam({ name: 'id', description: 'شناسه قاعده هشدار (UUID)' })
  @ApiResponse({ status: 200, description: 'قاعده هشدار به‌روزرسانی شد' })
  @ApiResponse({ status: 404, description: 'قاعده هشدار یافت نشد' })
  updateAlertRule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAlertRuleDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.updateAlertRule(id, dto, user);
  }

  @Patch('alerts/:id/toggle')
  @ApiOperation({ summary: 'تغییر وضعیت فعال / غیرفعال بودن قاعده هشدار' })
  @ApiParam({ name: 'id', description: 'شناسه قاعده هشدار (UUID)' })
  @ApiResponse({ status: 200, description: 'وضعیت قاعده تغییر یافت' })
  toggleAlertRule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.toggleAlertRule(id, user);
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'حذف قاعده هشدار' })
  @ApiParam({ name: 'id', description: 'شناسه قاعده هشدار (UUID)' })
  @ApiResponse({ status: 200, description: 'قاعده هشدار حذف شد' })
  deleteAlertRule(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.deleteAlertRule(id, user);
  }

  // ==============================================================================
  // TAB 1: TARGET KPIS CRUD
  // ==============================================================================

  @Get()
  @ApiOperation({ summary: 'فهرست شاخص‌های هدف KPI با مقدار واقعی و درصد پیشرفت منطقی (تب ۱)' })
  @ApiResponse({ status: 200, description: 'فهرست شاخص‌های KPI' })
  findAllKpis(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.findAllKpis(user);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد شاخص هدف KPI جدید' })
  @ApiResponse({ status: 201, description: 'KPI با موفقیت ایجاد شد' })
  @ApiResponse({ status: 403, description: 'تنها ادمین و مدیر مارکتینگ مجاز هستند' })
  createKpi(@Body() dto: CreateKpiDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.createKpi(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات شاخص هدف KPI' })
  @ApiParam({ name: 'id', description: 'شناسه KPI (UUID)' })
  @ApiResponse({ status: 200, description: 'مشخصات KPI' })
  @ApiResponse({ status: 404, description: 'KPI یافت نشد' })
  findOneKpi(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.findOneKpi(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات یا مقدار هدف شاخص KPI' })
  @ApiParam({ name: 'id', description: 'شناسه KPI (UUID)' })
  @ApiResponse({ status: 200, description: 'KPI با موفقیت به‌روزرسانی شد' })
  @ApiResponse({ status: 404, description: 'KPI یافت نشد' })
  updateKpi(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateKpiDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.updateKpi(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف شاخص هدف KPI' })
  @ApiParam({ name: 'id', description: 'شناسه KPI (UUID)' })
  @ApiResponse({ status: 200, description: 'KPI با موفقیت حذف شد' })
  @ApiResponse({ status: 404, description: 'KPI یافت نشد' })
  deleteKpi(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.kpisService.deleteKpi(id, user);
  }
}
