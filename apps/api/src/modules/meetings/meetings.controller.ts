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
import { MeetingsService, CurrentUserPayload } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی فهرست صورتجلسات سازمان به همراه مصوبات' })
  @ApiResponse({ status: 200, description: 'فهرست صورتجلسات' })
  async findAll(@Query('search') search: string, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.findAll(user, { search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کامل یک صورتجلسه همراه با مصوبات' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'ثبت صورتجلسه جدید به همراه مصوبات توافق‌شده' })
  @ApiResponse({ status: 201, description: 'صورتجلسه با موفقیت ایجاد شد' })
  async create(@Body() dto: CreateMeetingDto, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش صورتجلسه و ارتقای خودکار شماره نسخه' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف صورتجلسه' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.delete(id, user);
  }

  @Post(':id/action-items')
  @ApiOperation({ summary: 'افزودن مصوبه جدید به صورتجلسه' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async addActionItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActionItemDto,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.addActionItem(id, dto, user);
  }

  @Patch('action-items/:id/toggle')
  @ApiOperation({ summary: 'تغییر وضعیت انجام مصوبه' })
  @ApiParam({ name: 'id', description: 'شناسه UUID مصوبه' })
  async toggleActionItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isCompleted') isCompleted: boolean,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.toggleActionItem(id, isCompleted, user);
  }

  @Post('action-items/:id/convert-to-task')
  @ApiOperation({ summary: 'پیپ‌لاین تبدیل مستقیم مصوبه جلسه به وظیفه عملیاتی (Task)' })
  @ApiParam({ name: 'id', description: 'شناسه UUID مصوبه' })
  async convertActionItemToTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.convertActionItemToTask(id, user);
  }

  @Get(':id/email-preview')
  @ApiOperation({ summary: 'دریافت پیش‌نمایش ایمیل صورتجلسه جهت ارسال به حاضرین' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async previewEmail(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.previewEmail(id, user);
  }

  @Post(':id/send-email')
  @ApiOperation({ summary: 'تایید و ارسال صورتجلسه به حاضرین' })
  @ApiParam({ name: 'id', description: 'شناسه UUID صورتجلسه' })
  async sendEmail(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const user = req.user as CurrentUserPayload;
    return this.meetingsService.sendEmail(id, user);
  }
}
