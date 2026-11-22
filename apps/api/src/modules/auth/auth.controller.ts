import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ورود به سیستم با ایمیل یا شماره موبایل' })
  @ApiResponse({ status: 200, description: 'ورود موفق', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'اطلاعات ورود نامعتبر است' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const { response, rawRefreshToken } = await this.authService.login(dto, metadata);

    // Set secure HttpOnly cookie for refresh token (DEC-AUTH-01)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('gapji_refresh', rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تمدید توکن دسترسی با رفرش توکن کوکی' })
  @ApiResponse({ status: 200, description: 'چرخش موفق توکن' })
  @ApiResponse({ status: 401, description: 'توکن نامعتبر یا تشخیص بازپخش' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.['gapji_refresh'];
    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.authService.rotate(rawRefreshToken, metadata);

    // Update refresh token cookie with newly issued generation
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('gapji_refresh', result.rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'خروج از حساب کاربری و ابطال سشن' })
  @ApiResponse({ status: 200, description: 'خروج موفق' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.['gapji_refresh'];
    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    await this.authService.logout(rawRefreshToken, metadata);

    // Clear refresh cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('gapji_refresh', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/api/auth',
    });

    return {
      success: true,
      message: 'خروج با موفقیت انجام شد',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت مشخصات کاربر جاری از اکسس توکن' })
  @ApiResponse({ status: 200, description: 'اطلاعات کاربر احراز هویت شده' })
  @ApiResponse({ status: 401, description: 'احراز هویت الزامی است' })
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
    };
  }
}
