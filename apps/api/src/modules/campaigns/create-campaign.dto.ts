import { IsString, IsNotEmpty, IsEnum, IsDecimal, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus } from './campaign.entity';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsEnum(CampaignStatus)
  status: CampaignStatus;

  @Type(() => Number)
  @IsDecimal()
  budget: number;

  @IsUrl()
  @IsOptional()
  landingPageUrl?: string;
}
