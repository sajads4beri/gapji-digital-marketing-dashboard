import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@gapji.ir', required: false, nullable: true })
  email?: string | null;

  @ApiProperty({ example: '09123456789', required: false, nullable: true })
  mobile?: string | null;

  @ApiProperty({ example: 'مدیر مارکتینگ' })
  fullName: string;

  @ApiProperty({ example: 'admin' })
  role: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', required: false, nullable: true })
  organizationId?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 900, description: 'Token lifetime in seconds (15 minutes)' })
  expiresIn: number;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({ example: '/', description: 'Client redirect target after login (DEC-AUTH-10)' })
  redirectUrl: string;
}
