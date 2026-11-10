import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: ['today', '7d', '30d', 'this_month', 'custom'], default: '30d' })
  @IsOptional()
  @IsString()
  @IsIn(['today', '7d', '30d', 'this_month', 'custom'])
  preset?: 'today' | '7d' | '30d' | 'this_month' | 'custom';

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Start date in ISO format (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'End date in ISO format (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by one or multiple campaign IDs (comma-separated or string)' })
  @IsOptional()
  campaignIds?: string | string[];

  @ApiPropertyOptional({ description: 'Filter by one or multiple platform IDs (comma-separated or string)' })
  @IsOptional()
  platformIds?: string | string[];

  @ApiPropertyOptional({ description: 'Compare metrics with equivalent previous period' })
  @IsOptional()
  comparePrevious?: boolean | string;
}
