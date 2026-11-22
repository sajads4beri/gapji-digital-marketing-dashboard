import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationService, CurrentUserPayload } from './organization.service';
import { OrgListType } from './organization.constants';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { CreateTaxonomyItemDto } from './dto/create-taxonomy-item.dto';
import { UpdateTaxonomyItemDto } from './dto/update-taxonomy-item.dto';
import { ReorderTaxonomyItemsDto } from './dto/reorder-taxonomy-items.dto';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // ============================================================================
  // ۱. تنظیمات عمومی سازمان
  // ============================================================================

  @Get('general')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت مشخصات تنظیمات عمومی سازمان' })
  @ApiResponse({ status: 200, description: 'مشخصات تنظیمات عمومی سازمان' })
  async getGeneralSettings(@Req() req: any) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.getGeneralSettings(currentUser);
  }

  @Patch('general')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات عمومی سازمان (فقط ادمین)' })
  @ApiResponse({ status: 200, description: 'تنظیمات عمومی به‌روزرسانی شد' })
  async updateGeneralSettings(@Body() dto: UpdateGeneralSettingsDto, @Req() req: any) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.updateGeneralSettings(dto, currentUser);
  }

  // ============================================================================
  // ۲. گزینه‌ها و دسته‌بندی‌های سازمانی (Taxonomies)
  // ============================================================================

  @Get('taxonomies/:listType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت تمامی گزینه‌های یک فهرست سازمانی به همراه تعداد استفاده' })
  @ApiParam({ name: 'listType', enum: ['campaign_types', 'lead_sources', 'lead_statuses', 'lost_reasons', 'cost_categories'] })
  async getListItems(@Param('listType') listType: OrgListType, @Req() req: any) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.getListItems(listType, currentUser);
  }

  @Get('taxonomies/:listType/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت یک گزینه خاص از فهرست سازمانی با شناسه' })
  async getListItemById(
    @Param('listType') listType: OrgListType,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.getListItemById(listType, id, currentUser);
  }

  @Post('taxonomies/:listType')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'افزودن گزینه جدید به فهرست سازمانی (فقط ادمین)' })
  async createListItem(
    @Param('listType') listType: OrgListType,
    @Body() dto: CreateTaxonomyItemDto,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.createListItem(listType, dto, currentUser);
  }

  @Patch('taxonomies/:listType/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش مشخصات یک گزینه در فهرست سازمانی (فقط ادمین)' })
  async updateListItem(
    @Param('listType') listType: OrgListType,
    @Param('id') id: string,
    @Body() dto: UpdateTaxonomyItemDto,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.updateListItem(listType, id, dto, currentUser);
  }

  @Patch('taxonomies/:listType/:id/toggle-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغییر وضعیت فعال/غیرفعال بودن یک گزینه (فقط ادمین)' })
  async toggleListItemStatus(
    @Param('listType') listType: OrgListType,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.toggleListItemStatus(listType, id, currentUser);
  }

  @Put('taxonomies/:listType/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'مرتب‌سازی گزینه‌های یک فهرست سازمانی (فقط ادمین)' })
  async reorderListItems(
    @Param('listType') listType: OrgListType,
    @Body() dto: ReorderTaxonomyItemsDto,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.reorderListItems(listType, dto, currentUser);
  }

  @Delete('taxonomies/:listType/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف فیزیکی یک گزینه در صورت عدم استفاده (فقط ادمین)' })
  async deleteListItem(
    @Param('listType') listType: OrgListType,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.orgService.deleteListItem(listType, id, currentUser);
  }
}
