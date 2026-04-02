import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123', required: false })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(6)
  oldPassword?: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
