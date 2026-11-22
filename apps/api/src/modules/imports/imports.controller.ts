import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ImportsService } from './imports.service';
import { InspectImportDto } from './dto/inspect-import.dto';
import { ValidateImportDto } from './dto/validate-import.dto';
import { ExecuteImportDto } from './dto/execute-import.dto';
import { CurrentUserPayload } from './dto/current-user-payload.interface';

@ApiTags('imports')
@Controller('imports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('fields')
  @ApiOperation({ summary: 'دریافت فهرست فیلدهای هدف و متادیتای نگاشت سامانه' })
  @ApiQuery({ name: 'type', enum: ['leads', 'costs'], required: true })
  @ApiResponse({ status: 200, description: 'فهرست فیلدهای هدف' })
  getTargetFields(@Query('type') type: string, @Req() req: any) {
    if (!type || (type !== 'leads' && type !== 'costs')) {
      throw new BadRequestException('پارامتر type باید leads یا costs باشد');
    }
    const user = req.user as CurrentUserPayload;
    return this.importsService.getTargetFields(type, user);
  }

  @Post('inspect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'بررسی فایل CSV، استخراج هدرها و پیشنهاد خودکار نگاشت ستون‌ها' })
  @ApiResponse({ status: 200, description: 'هدرها، نمونه سطرها و نگاشت اولیه' })
  @ApiResponse({ status: 400, description: 'خطا در خواندن فایل یا فرمت نامعتبر' })
  inspectFile(@Body() dto: InspectImportDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.importsService.inspectFile(dto, user);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'اعتبارسنجی معتبر سطرها بر اساس قوانین کسب‌وکار و شناسایی داده‌های تکراری' })
  @ApiResponse({ status: 200, description: 'نتایج تفکیک‌شده سطرهای معتبر، نامعتبر و تکراری' })
  @ApiResponse({ status: 400, description: 'خطای نگاشت فیلدهای اجباری' })
  validateRows(@Body() dto: ValidateImportDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.importsService.validateRows(dto, user);
  }

  @Post('execute')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'اجرای نهایی ذخیره‌سازی دسته‌ای در PostgreSQL با محافظت عدم تکرار' })
  @ApiResponse({ status: 201, description: 'ایمپورت با موفقیت انجام شد' })
  @ApiResponse({ status: 409, description: 'عملیات با این شناسه قبلاً اجرا یا در حال پردازش است' })
  executeImport(@Body() dto: ExecuteImportDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.importsService.executeImport(dto, user);
  }

  @Get('template')
  @ApiOperation({ summary: 'دریافت محتوای نمونه فایل CSV با ساختار ستون‌های استاندارد' })
  @ApiQuery({ name: 'type', enum: ['leads', 'costs'], required: true })
  @ApiResponse({ status: 200, description: 'محتوای متنی فایل نمونه CSV' })
  getTemplate(@Query('type') type: string, @Req() req: any) {
    if (!type || (type !== 'leads' && type !== 'costs')) {
      throw new BadRequestException('پارامتر type باید leads یا costs باشد');
    }
    const user = req.user as CurrentUserPayload;
    return this.importsService.getSampleTemplate(type, user);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'دریافت سوابق عملیات‌های ایمپورت سازمان' })
  @ApiQuery({ name: 'type', enum: ['leads', 'costs'], required: false })
  @ApiResponse({ status: 200, description: 'فهرست سوابق ایمپورت' })
  getRecentJobs(@Query('type') type: string | undefined, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.importsService.getRecentJobs(type, user);
  }
}
