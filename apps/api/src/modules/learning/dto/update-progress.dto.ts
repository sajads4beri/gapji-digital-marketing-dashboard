import {
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
