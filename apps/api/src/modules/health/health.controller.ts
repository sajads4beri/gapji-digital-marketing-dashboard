import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'بررسی سلامت سرور و ارتباط با دیتابیس (Liveness & Readiness Probe)' })
  @ApiResponse({ status: 200, description: 'سرور و پایگاه داده فعال هستند' })
  @ApiResponse({ status: 503, description: 'پایگاه داده در دسترس نیست' })
  async check(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startTime;
    } catch (err: any) {
      dbStatus = 'unreachable';
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        services: {
          api: 'healthy',
          database: {
            status: 'unreachable',
            error: err.message,
          },
        },
      });
    }

    const memoryUsage = process.memoryUsage();

    return res.status(HttpStatus.OK).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      services: {
        api: 'healthy',
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    });
  }
}
