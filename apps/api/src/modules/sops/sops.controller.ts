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
import { SopsService } from './sops.service';
import { CreateSopDto } from './dto/create-sop.dto';
import { UpdateSopDto } from './dto/update-sop.dto';
import { CreateTaskFromSopDto } from './dto/create-task-from-sop.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('sops')
@Controller('sops')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SopsController {
  constructor(private readonly sopsService: SopsService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی فهرست دستورالعمل‌های استاندارد سازمان' })
  @ApiResponse({ status: 200, description: 'فهرست دستورالعمل‌ها' })
  async findAll(
    @Query('category') category: string,
    @Query('status') status: string,
    @Query('search') search: string,
    @Req() req: any
  ) {
    return this.sopsService.findAll(req.user, { category, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کامل یک دستورالعمل به همراه تاریخچه نسخه‌ها' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.sopsService.findById(req.user, id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد دستورالعمل استاندارد جدید' })
  @ApiResponse({ status: 201, description: 'دستورالعمل با موفقیت ایجاد شد' })
  async create(@Body() dto: CreateSopDto, @Req() req: any) {
    return this.sopsService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش دستورالعمل و ارتقای خودکار نگارش در صورت تغییر محتوا' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSopDto,
    @Req() req: any
  ) {
    return this.sopsService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف دستورالعمل' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.sopsService.delete(req.user, id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'دریافت تاریخچه نسخه‌های یک دستورالعمل' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async getVersions(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.sopsService.getVersions(req.user, id);
  }

  @Post(':id/rollback')
  @ApiOperation({ summary: 'بازگشت به یکی از نسخه‌های تاریخی دستورالعمل' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async rollback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('versionNumber') versionNumber: string,
    @Req() req: any
  ) {
    return this.sopsService.rollbackVersion(req.user, id, versionNumber);
  }

  @Post(':id/create-task')
  @ApiOperation({ summary: 'ایجاد مستقیم وظیفه عملیاتی (Task) از روی دستورالعمل' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دستورالعمل' })
  async createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskFromSopDto,
    @Req() req: any
  ) {
    return this.sopsService.createTaskFromSop(req.user, id, dto);
  }
}
