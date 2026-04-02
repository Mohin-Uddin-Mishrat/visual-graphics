import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'OldPassword123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  oldPassword?: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
