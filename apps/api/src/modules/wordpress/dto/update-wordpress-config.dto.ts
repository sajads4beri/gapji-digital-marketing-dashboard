import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateWordpressConfigDto {
  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsString()
  leadMappingConfig?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
