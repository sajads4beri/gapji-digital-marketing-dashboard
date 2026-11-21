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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EquipmentService, CurrentUserPayload } from './equipment.service';
import { CreateEquipmentItemDto } from './dto/create-equipment-item.dto';
import { UpdateEquipmentItemDto } from './dto/update-equipment-item.dto';
import { ApplyEquipmentTemplateDto } from './dto/apply-template.dto';
import { UpdateReadinessStatusDto } from './dto/update-readiness.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('equipment')
@Controller('equipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('shortages')
  @ApiOperation({
    summary: 'واکشی کسری‌های تجهیزات بر اساس تاریخ رویدادها همراه با هشدار ۳ روزه',
  })
  @ApiResponse({ status: 200, description: 'فهرست کسری‌های تجهیزات و رویدادها' })
  async getShortages(
    @Query('status') status: string,
    @Query('urgentOnly') urgentOnly: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.getShortages(user, {
      status,
      urgentOnly: urgentOnly === 'true',
    });
  }

  @Get('items')
  @ApiOperation({ summary: 'واکشی فهرست کلیه اقلام تجهیزات سازمان' })
  @ApiResponse({ status: 200, description: 'فهرست اقلام تجهیزات' })
  async getItems(
    @Query('search') search: string,
    @Query('category') category: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.getItems(user, { search, category });
  }

  @Post('items')
  @ApiOperation({ summary: 'ثبت قلم تجهیز جدید در انبار سازمان' })
  @ApiResponse({ status: 201, description: 'تجهیز جدید با موفقیت ثبت شد' })
  async createItem(@Body() dto: CreateEquipmentItemDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.createItem(dto, user);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'ویرایش مشخصات قلم تجهیز' })
  @ApiParam({ name: 'id', description: 'شناسه UUID قلم تجهیز' })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentItemDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.updateItem(id, dto, user);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'حذف یا غیرفعال‌سازی قلم تجهیز' })
  @ApiParam({ name: 'id', description: 'شناسه UUID قلم تجهیز' })
  async deleteItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.deleteItem(id, user);
  }

  @Get('templates')
  @ApiOperation({ summary: 'دریافت فهرست قالب‌های آماده پکیج‌های تجهیزات' })
  @ApiResponse({ status: 200, description: 'فهرست قالب‌های پکیج تجهیزات' })
  async getTemplates(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.getTemplates(user);
  }

  @Post('apply-template')
  @ApiOperation({ summary: 'اعمال دسته‌ای یک قالب تجهیزات روی یک کمپین یا وبینار' })
  @ApiResponse({ status: 201, description: 'قالب با موفقیت اعمال شد' })
  async applyTemplate(@Body() dto: ApplyEquipmentTemplateDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.applyTemplate(dto, user);
  }

  @Patch('readiness/:id')
  @ApiOperation({ summary: 'به‌روزرسانی وضعیت آمادگی تجهیز رویداد (آماده، ناقص، تهیه نشده)' })
  @ApiParam({ name: 'id', description: 'شناسه UUID رکورد EventEquipment' })
  async updateReadiness(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReadinessStatusDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.equipmentService.updateReadiness(id, dto, user);
  }
}
