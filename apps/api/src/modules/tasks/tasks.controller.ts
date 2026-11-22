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
import { TasksService, CurrentUserPayload } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskSubtaskDto } from './dto/create-task-subtask.dto';
import { UpdateTaskSubtaskDto } from './dto/update-task-subtask.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت فهرست تسک‌های سازمان با فیلترهای چندگانه' })
  @ApiResponse({ status: 200, description: 'فهرست تسک‌ها با موفقیت بازگردانده شد' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربری به ماژول تسک‌ها' })
  async findAll(@Query() query: GetTasksFilterDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.tasksService.findAll(query, user);
  }

  @Get('assignees')
  @ApiOperation({ summary: 'دریافت فهرست کاربران فعال سازمان جهت گزینه‌های تخصیص تسک' })
  @ApiResponse({ status: 200, description: 'فهرست کاربران فعال' })
  async getAssignees(@Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.tasksService.getAssignees(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کامل یک تسک بر اساس شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'مشخصات تسک' })
  @ApiResponse({ status: 404, description: 'تسک یافت نشد' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.findOne(id, user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'دریافت تاریخچه رویدادهای تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'تاریخچه رویدادها' })
  async getHistory(@Param('id') id: string, @Req() req: any) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.getHistory(id, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد تسک جدید در دیتابیس سازمان' })
  @ApiResponse({ status: 201, description: 'تسک با موفقیت ایجاد شد' })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی ورودی‌ها' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی نقش کاربری' })
  async create(@Body() dto: CreateTaskDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.tasksService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش مشخصات تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'تسک با موفقیت به‌روزرسانی شد' })
  @ApiResponse({ status: 404, description: 'تسک یافت نشد' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.update(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'وضعیت تسک با موفقیت تغییر کرد' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.updateStatus(id, dto.status, user);
  }

  @Patch(':id/toggle-complete')
  @ApiOperation({ summary: 'تغییر سریع تیک وضعیت تکمیل تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'وضعیت تکمیل تسک تغییر یافت' })
  async toggleComplete(
    @Param('id') id: string,
    @Body() body: { completed?: boolean },
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.toggleComplete(id, body?.completed, user);
  }

  @Patch(':id/assignee')
  @ApiOperation({ summary: 'تخصیص یا لغو تخصیص مسئول تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'مسئول تسک به‌روزرسانی شد' })
  async updateAssignee(
    @Param('id') id: string,
    @Body() dto: UpdateTaskAssigneeDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.updateAssignee(id, dto.assigneeId ?? null, user);
  }

  @Patch(':id/due-date')
  @ApiOperation({ summary: 'تغییر تاریخ سررسید تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'تاریخ سررسید به‌روزرسانی شد' })
  async updateDueDate(
    @Param('id') id: string,
    @Body() body: { dueDate: string },
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    if (!body?.dueDate) {
      throw new BadRequestException('تاریخ سررسید الزامی است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.updateDueDate(id, body.dueDate, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف تسک از سیستم' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 200, description: 'تسک با موفقیت حذف شد' })
  @ApiResponse({ status: 403, description: 'فقط ادمین یا ایجادکننده مجاز به حذف هستند' })
  async remove(@Param('id') id: string, @Req() req: any) {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.remove(id, user);
  }

  @Post(':id/subtasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'افزودن زیرتسک به چک‌لیست تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 201, description: 'زیرتسک ایجاد شد' })
  async addSubtask(
    @Param('id') taskId: string,
    @Body() dto: CreateTaskSubtaskDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(taskId)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.addSubtask(taskId, dto, user);
  }

  @Patch(':id/subtasks/:subtaskId')
  @ApiOperation({ summary: 'ویرایش زیرتسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiParam({ name: 'subtaskId', description: 'شناسه یکتای زیرتسک' })
  @ApiResponse({ status: 200, description: 'زیرتسک به‌روزرسانی شد' })
  async updateSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateTaskSubtaskDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(taskId) || !UUID_REGEX.test(subtaskId)) {
      throw new BadRequestException('شناسه تسک یا زیرتسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.updateSubtask(taskId, subtaskId, dto, user);
  }

  @Patch(':id/subtasks/:subtaskId/toggle')
  @ApiOperation({ summary: 'تغییر وضعیت تیک تکمیل زیرتسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiParam({ name: 'subtaskId', description: 'شناسه یکتای زیرتسک' })
  @ApiResponse({ status: 200, description: 'وضعیت تکمیل زیرتسک تغییر یافت' })
  async toggleSubtask(
    @Param('id') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() body: { completed?: boolean },
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(taskId) || !UUID_REGEX.test(subtaskId)) {
      throw new BadRequestException('شناسه تسک یا زیرتسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.toggleSubtask(taskId, subtaskId, body?.completed, user);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'افزودن دیدگاه / کامنت به تسک' })
  @ApiParam({ name: 'id', description: 'شناسه یکتای تسک' })
  @ApiResponse({ status: 201, description: 'کامنت با موفقیت ثبت شد' })
  async addComment(
    @Param('id') taskId: string,
    @Body() dto: CreateTaskCommentDto,
    @Req() req: any,
  ) {
    if (!UUID_REGEX.test(taskId)) {
      throw new BadRequestException('شناسه تسک نامعتبر است');
    }
    const user = req.user as CurrentUserPayload;
    return this.tasksService.addComment(taskId, dto, user);
  }
}
