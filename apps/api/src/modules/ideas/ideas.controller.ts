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
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaStatusDto } from './dto/update-idea-status.dto';
import { ConvertIdeaToTaskDto } from './dto/convert-idea-to-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ideas')
@Controller('ideas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  @ApiOperation({ summary: 'واکشی فهرست ایده‌ها به همراه شمارش آرا و وضعیت رأی کاربر' })
  @ApiResponse({ status: 200, description: 'فهرست ایده‌ها' })
  async findAll(
    @Query('category') category: string,
    @Query('status') status: string,
    @Query('campaignId') campaignId: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: 'votes' | 'newest',
    @Req() req: any
  ) {
    return this.ideasService.findAll(req.user, {
      category,
      status,
      campaignId,
      search,
      sortBy,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت مشخصات کامل یک ایده' })
  @ApiParam({ name: 'id', description: 'شناسه UUID ایده' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.ideasService.findById(req.user, id);
  }

  @Post()
  @ApiOperation({ summary: 'ثبت ایده نوآورانه جدید' })
  @ApiResponse({ status: 201, description: 'ایده با موفقیت ثبت شد' })
  async create(@Body() dto: CreateIdeaDto, @Req() req: any) {
    return this.ideasService.create(req.user, dto);
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'رأی مثبت یا لغو رأی (1-Click Reversible Upvote)' })
  @ApiParam({ name: 'id', description: 'شناسه UUID ایده' })
  async toggleVote(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.ideasService.toggleVote(req.user, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت ایده و ثبت یادداشت بررسی توسط مدیر' })
  @ApiParam({ name: 'id', description: 'شناسه UUID ایده' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIdeaStatusDto,
    @Req() req: any
  ) {
    return this.ideasService.updateStatus(req.user, id, dto);
  }

  @Post(':id/convert-to-task')
  @ApiOperation({ summary: 'تبدیل مستقیم ایده به وظیفه عملیاتی (Task)' })
  @ApiParam({ name: 'id', description: 'شناسه UUID ایده' })
  async convertToTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertIdeaToTaskDto,
    @Req() req: any
  ) {
    return this.ideasService.convertToTask(req.user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف ایده' })
  @ApiParam({ name: 'id', description: 'شناسه UUID ایده' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.ideasService.delete(req.user, id);
  }
}
