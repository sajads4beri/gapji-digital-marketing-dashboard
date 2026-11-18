import {
  Controller,
  Get,
  Post,
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
import { LandingService, CurrentUserPayload } from './landing.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { CreateUtmLinkDto } from './dto/create-utm-link.dto';
import { PreviewUtmDto } from './dto/preview-utm.dto';

@ApiTags('landing')
@Controller('landing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  // ==============================================================================
  // OPTIONS & STATUS ENDPOINTS
  // ==============================================================================

  @Get('options')
  @ApiOperation({ summary: 'دریافت گزینه‌های انتخابی فرم سازنده UTM (لندینگ‌ها، کمپین‌ها، پلتفرم‌ها و رسانه‌ها)' })
  @ApiResponse({ status: 200, description: 'فهرست گزینه‌ها' })
  getOptions(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.getOptions(user);
  }

  @Get('wordpress-status')
  @ApiOperation({ summary: 'وضعیت اتصال افزونه وردپرس و آدرس وب‌هوک دریافت لیدها' })
  @ApiResponse({ status: 200, description: 'وضعیت اتصال وردپرس' })
  getWordPressStatus(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.getWordPressStatus(user);
  }

  // ==============================================================================
  // LANDING PAGES ENDPOINTS
  // ==============================================================================

  @Get('pages')
  @ApiOperation({ summary: 'فهرست صفحات لندینگ همراه با وضعیت اتصال، لیدهای ۷ روز اخیر و هشدار ۳۰ روزه' })
  @ApiResponse({ status: 200, description: 'فهرست صفحات لندینگ' })
  findAllLandingPages(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.findAllLandingPages(user);
  }

  @Post('pages')
  @ApiOperation({ summary: 'ثبت صفحه لندینگ جدید با اعتبارسنجی پروتکل HTTPS' })
  @ApiResponse({ status: 201, description: 'صفحه لندینگ با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی آدرس اینترنتی یا عدم استفاده از HTTPS' })
  createLandingPage(@Body() dto: CreateLandingPageDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.createLandingPage(dto, user);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'حذف صفحه لندینگ' })
  @ApiParam({ name: 'id', description: 'شناسه لندینگ (UUID)' })
  @ApiResponse({ status: 200, description: 'لندینگ حذف شد' })
  @ApiResponse({ status: 404, description: 'لندینگ یافت نشد' })
  deleteLandingPage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.deleteLandingPage(id, user);
  }

  // ==============================================================================
  // UTM BUILDER & HISTORY ENDPOINTS
  // ==============================================================================

  @Get('utm')
  @ApiOperation({ summary: 'تاریخچه لینک‌های UTM ساخته‌شده همراه با انتساب تعداد لیدهای واقعی' })
  @ApiResponse({ status: 200, description: 'تاریخچه لینک‌های UTM' })
  findAllUtmLinks(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.findAllUtmLinks(user);
  }

  @Post('utm/preview')
  @ApiOperation({ summary: 'پیش‌نمایش زنده آدرس نهایی UTM با انکودینگ امن و حفظ کوئری‌های قبلی' })
  @ApiResponse({ status: 200, description: 'آدرس نهایی تولید شده' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی آدرس یا پارامترها' })
  previewUtmLink(@Body() dto: PreviewUtmDto) {
    return this.landingService.previewUtmLink(dto);
  }

  @Post('utm')
  @ApiOperation({ summary: 'ساخت و ذخیره دائم لینک UTM در پایگاه داده' })
  @ApiResponse({ status: 201, description: 'لینک UTM با موفقیت ذخیره شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی فیلدها' })
  createUtmLink(@Body() dto: CreateUtmLinkDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.landingService.createUtmLink(dto, user);
  }
}
