import { IsUUID, IsArray, ArrayMinSize } from 'class-validator';

export class AssignResourceDto {
  @IsUUID()
  resourceId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];
}
