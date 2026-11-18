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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService, CurrentUserPayload } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { TransferAdminDto } from './dto/transfer-admin.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { UserQueryDto } from './dto/user-query.dto';
import {
  UserResponseDto,
  InviteUserResponseDto,
  ResendInvitationResponseDto,
} from './dto/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت فهرست کاربران و اعضای سازمان جاری با فیلتر' })
  @ApiResponse({ status: 200, description: 'فهرست کاربران', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  async findAll(@Query() query: UserQueryDto, @Req() req: any): Promise<UserResponseDto[]> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.findAll(query, currentUser);
  }

  @Get('access-matrix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت ماتریس سطوح دسترسی نقش‌های شش‌گانه سازمان' })
  @ApiResponse({ status: 200, description: 'ماتریس نقش‌ها و دسترسی‌ها' })
  async getAccessMatrix() {
    return this.usersService.getAccessMatrix();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت مشخصات و نقش سازمانی کاربر جاری' })
  @ApiResponse({ status: 200, description: 'پروفایل کاربر جاری', type: UserResponseDto })
  async getMe(@Req() req: any): Promise<UserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.findOne(currentUser.id, currentUser);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت مشخصات یک کاربر بر اساس شناسه' })
  @ApiParam({ name: 'id', description: 'شناسه UUID کاربر' })
  @ApiResponse({ status: 200, description: 'مشخصات کاربر', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'کاربر در این سازمان یافت نشد' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.findOne(id, currentUser);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'دعوت کاربر جدید به سازمان با ایمیل و نقش (ویژه ادمین)' })
  @ApiResponse({ status: 201, description: 'دعوت‌نامه با موفقیت صادر شد', type: InviteUserResponseDto })
  @ApiResponse({ status: 400, description: 'خطای اعتبارسنجی یا عضویت تکراری' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی (فقط ادمین مجاز است)' })
  async invite(
    @Body() dto: InviteUserDto,
    @Req() req: any,
  ): Promise<InviteUserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.invite(dto, currentUser);
  }

  @Post(':id/resend-invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ارسال مجدد دعوت‌نامه برای کاربر در انتظار (ویژه ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر دعوت‌شده' })
  @ApiResponse({ status: 200, description: 'دعوت‌نامه مجدد صادر شد', type: ResendInvitationResponseDto })
  @ApiResponse({ status: 400, description: 'کاربر در وضعیت دعوت‌شده نیست' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی (فقط ادمین مجاز است)' })
  async resendInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<ResendInvitationResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.resendInvite(id, currentUser);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغییر نقش سازمانی کاربر با گارد آخرین ادمین (ویژه ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiResponse({ status: 200, description: 'نقش کاربر با موفقیت تغییر یافت', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'خطای گارد آخرین ادمین یا داده نامعتبر' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی (فقط ادمین مجاز است)' })
  async changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.changeRole(id, dto, currentUser);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'غیرفعال‌سازی حساب کاربر در سازمان با گارد آخرین ادمین (ویژه ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiResponse({ status: 200, description: 'کاربر غیرفعال شد', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'خطای گارد عدم امکان غیرفعال‌سازی تنها ادمین' })
  @ApiResponse({ status: 403, description: 'عدم دسترسی (فقط ادمین مجاز است)' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.deactivate(id, currentUser);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'فعال‌سازی مجدد کاربر غیرفعال‌شده در سازمان (ویژه ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiResponse({ status: 200, description: 'کاربر فعال شد', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'عدم دسترسی (فقط ادمین مجاز است)' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.activate(id, currentUser);
  }

  @Post('transfer-admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'انتقال اتمیک مسئولیت مدیریت ارشد به عضو دیگر (ویژه ادمین)' })
  @ApiResponse({ status: 200, description: 'انتقال مسئولیت با موفقیت انجام شد' })
  @ApiResponse({ status: 400, description: 'خطای داده نامعتبر یا کاربر جایگزین نامناسب' })
  async transferAdmin(
    @Body() dto: TransferAdminDto,
    @Req() req: any,
  ) {
    const currentUser: CurrentUserPayload = req.user;
    return this.usersService.transferAdmin(dto, currentUser);
  }

  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'پذیرش عمومی دعوت‌نامه با توکن یک‌بارمصرف رمزنگاری‌شده' })
  @ApiResponse({ status: 200, description: 'دعوت‌نامه پذیرفته و حساب فعال شد' })
  @ApiResponse({ status: 400, description: 'توکن نامعتبر یا منقضی‌شده' })
  async acceptInvite(@Body() dto: AcceptInvitationDto) {
    return this.usersService.acceptInvite(dto);
  }
}
