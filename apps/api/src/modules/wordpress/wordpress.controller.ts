import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Headers,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WordpressService } from './wordpress.service';
import { UpdateWordpressConfigDto } from './dto/update-wordpress-config.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('wordpress')
@Controller('wordpress')
export class WordpressController {
  constructor(private readonly wordpressService: WordpressService) {}

  /**
   * دریافت عمومی وب‌هوک ورودی از وردپرس (احراز هویت شده توسط Secret Header / Token)
   */
  @Post('webhook')
  @ApiOperation({ summary: 'دریافت وب‌هوک لید از وردپرس' })
  async handleWebhook(
    @Headers('x-webhook-secret') headerSecret: string,
    @Query('secret') querySecret: string,
    @Body() payload: any,
    @Req() req: any
  ) {
    const secret = headerSecret || querySecret || payload?.webhookSecret;
    return this.wordpressService.handleWebhook(secret, payload, req.ip);
  }

  /**
   * دریافت تنظیمات و کلیدهای اتصال وردپرس
   */
  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت تنظیمات یکپارچه‌سازی با وردپرس' })
  async getConfig(@Req() req: any) {
    return this.wordpressService.getConfig(req.user);
  }

  /**
   * به‌روزرسانی تنظیمات و نگاشت فیلدهای وردپرس
   */
  @Patch('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش تنظیمات وردپرس و فیلدهای نگاشت' })
  async updateConfig(@Body() dto: UpdateWordpressConfigDto, @Req() req: any) {
    return this.wordpressService.updateConfig(req.user, dto);
  }

  /**
   * نوسازی و چرخش کلید امنیتی وب‌هوک (Secret Rotation)
   */
  @Post('rotate-secret')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'نوسازی کلید امنیتی وب‌هوک وردپرس' })
  async rotateSecret(@Req() req: any) {
    return this.wordpressService.rotateSecret(req.user);
  }

  /**
   * تست سلامت اتصال و نگاشت فیلدها با پی‌لود شبیه‌سازی‌شده
   */
  @Post('test-connection')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تست اتصال و ارسال لید نمونه' })
  async testConnection(@Body() dto: TestConnectionDto, @Req() req: any) {
    return this.wordpressService.testConnection(req.user, dto);
  }

  /**
   * واکشی لاگ درخواست‌های ورودی و ردشده وردپرس
   */
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت لاگ درخواست‌های وب‌هوک وردپرس' })
  async getLogs(@Req() req: any) {
    return this.wordpressService.getWebhookLogs(req.user);
  }
}
