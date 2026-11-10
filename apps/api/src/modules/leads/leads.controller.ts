import {
  Controller,
  Get,
  Post,
  Patch,
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
import { LeadsService, CurrentUserPayload } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetLeadsFilterDto } from './dto/get-leads-filter.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('leads')
@Controller('leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ثبت دستی لید جدید در سازمان' })
  @ApiResponse({ status: 201, description: 'لید با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربری به ماژول لید' })
  @ApiResponse({ status: 409, description: 'شماره تلفن تکراری در سازمان' })
  async create(@Body() dto: CreateLeadDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.leadsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'دریافت لیست لیدهای صندوق سازمان' })
  @ApiResponse({ status: 200, description: 'لیست لیدها' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  async findAll(@Query() query: GetLeadsFilterDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.leadsService.findAll(query, user);
  }

  @Get('assignees')
  @ApiOperation({ summary: 'دریافت لیست کارشناسان فعال سازمان جهت تخصیص لید' })
  @ApiResponse({ status: 200, description: 'لیست اعضا' })
  async getAssignees(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.leadsService.getAssignees(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت جزئیات کامل یک لید' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای لید' })
  @ApiResponse({ status: 200, description: 'مشخصات لید' })
  @ApiResponse({ status: 404, description: 'لید یافت نشد' })
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException('شناسه لید نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.leadsService.findOne(id, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'به‌روزرسانی وضعیت لید در پایپ‌لاین فروش' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای لید' })
  @ApiResponse({ status: 200, description: 'وضعیت لید با موفقیت به‌روزرسانی شد' })
  @ApiResponse({ status: 400, description: 'ورودی‌های نامعتبر' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  @ApiResponse({ status: 404, description: 'لید یافت نشد' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: any,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException('شناسه لید نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.leadsService.updateStatus(id, dto, user);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'دریافت تاریخچه تعاملات و رخدادهای لید' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای لید' })
  @ApiResponse({ status: 200, description: 'لیست رخدادهای لید' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی' })
  @ApiResponse({ status: 404, description: 'لید یافت نشد' })
  async getActivities(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException('شناسه لید نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.leadsService.getActivities(id, user);
  }
}
