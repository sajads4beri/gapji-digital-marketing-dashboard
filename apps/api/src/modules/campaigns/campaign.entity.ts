import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CampaignStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CampaignHealth {
  HEALTHY = 'healthy',
  NEEDS_ATTENTION = 'needs_attention',
  CRITICAL = 'critical',
}

export class Campaign {
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant organization identifier (UUID)',
    example: '00000000-0000-0000-0000-000000000001',
  })
  organizationId: string;

  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Sale 2026',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed campaign description',
    example: 'Summer discount campaign on Instagram',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Marketing channel',
    example: 'instagram',
  })
  channel: string;

  @ApiPropertyOptional({
    description: 'Campaign type / category',
    example: 'lead_generation',
    nullable: true,
  })
  type?: string | null;

  @ApiPropertyOptional({
    description: 'Strategic objective',
    example: 'increase_sales',
    nullable: true,
  })
  objective?: string | null;

  @ApiProperty({
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
    description: 'Current campaign status',
  })
  status: CampaignStatus;

  @ApiPropertyOptional({
    enum: CampaignHealth,
    default: CampaignHealth.HEALTHY,
    description: 'Campaign health indicator',
  })
  health?: CampaignHealth;

  @ApiProperty({
    description: 'Allocated budget (integer JSON number)',
    example: 50000000,
  })
  budget: number;

  @ApiProperty({
    description: 'Total spend so far (integer JSON number)',
    example: 12500000,
  })
  spend: number;

  @ApiProperty({
    description: 'Impression count',
    example: 150000,
  })
  impressions: number;

  @ApiProperty({
    description: 'Click count',
    example: 3200,
  })
  clicks: number;

  @ApiProperty({
    description: 'Conversion count',
    example: 180,
  })
  conversions: number;

  @ApiPropertyOptional({
    description: 'Campaign start date',
    nullable: true,
  })
  startDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Campaign end date',
    nullable: true,
  })
  endDate?: Date | null;

  @ApiPropertyOptional({
    description: 'Target leads count',
    nullable: true,
  })
  targetLeads?: number | null;

  @ApiPropertyOptional({
    description: 'Target sales count',
    nullable: true,
  })
  targetSales?: number | null;

  @ApiPropertyOptional({
    description: 'Assigned manager user ID',
    nullable: true,
  })
  ownerId?: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
