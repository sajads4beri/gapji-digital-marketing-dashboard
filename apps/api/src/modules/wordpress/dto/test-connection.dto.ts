import { IsString, IsOptional } from 'class-validator';

export class TestConnectionDto {
  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  payload?: Record<string, any>;
}
