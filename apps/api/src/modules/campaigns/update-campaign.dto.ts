import { IsString, IsNotEmpty, IsEnum, IsDecimal, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {}
