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
import { LearningService } from './learning.service';
import { CreateLearningResourceDto } from './dto/create-learning-resource.dto';
import { UpdateLearningResourceDto } from './dto/update-learning-resource.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AssignResourceDto } from './dto/assign-resource.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('learning')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی فهرست دوره‌ها و منابع آموزشی به همراه وضعیت کاربر' })
  @ApiResponse({ status: 200, description: 'فهرست منابع آموزشی' })
  async findAll(
    @Query('category') category: string,
    @Query('software') software: string,
    @Query('type') type: string,
    @Query('search') search: string,
    @Req() req: any
  ) {
    return this.learningService.findAll(req.user, {
      category,
      software,
      type,
      search,
    });
  }

  @Get('matrix')
  @ApiOperation({ summary: 'دریافت ماتریس پیشرفت آموزش اعضای تیم (ویژه مدیران)' })
  @ApiResponse({ status: 200, description: 'ماتریس کاربر × دوره' })
  async getMatrix(@Req() req: any) {
    return this.learningService.getTeamProgressMatrix(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کامل یک دوره آموزشی' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دوره' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.learningService.findById(req.user, id);
  }

  @Post()
  @ApiOperation({ summary: 'افزودن دوره یا منبع آموزشی جدید' })
  @ApiResponse({ status: 201, description: 'منبع آموزشی با موفقیت ایجاد شد' })
  async create(@Body() dto: CreateLearningResourceDto, @Req() req: any) {
    return this.learningService.create(req.user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات منبع آموزشی' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دوره' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLearningResourceDto,
    @Req() req: any
  ) {
    return this.learningService.update(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف دوره یا منبع آموزشی' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دوره' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.learningService.delete(req.user, id);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'به‌روزرسانی وضعیت پیشرفت یادگیری، امتیاز و یادداشت کاربر' })
  @ApiParam({ name: 'id', description: 'شناسه UUID دوره' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
    @Req() req: any
  ) {
    return this.learningService.updateUserProgress(req.user, id, dto);
  }

  @Post('assign')
  @ApiOperation({ summary: 'تخصیص دوره آموزشی به اعضای تیم' })
  @ApiResponse({ status: 200, description: 'تخصیص با موفقیت انجام شد' })
  async assign(@Body() dto: AssignResourceDto, @Req() req: any) {
    return this.learningService.assignResource(req.user, dto);
  }
}
