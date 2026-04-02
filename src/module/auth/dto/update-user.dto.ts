import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

class UpdateUserBaseDto extends PartialType(
  PickType(CreateUserDto, ['name', 'email'] as const),
) {}

export class UpdateUserDto extends UpdateUserBaseDto {
  @ApiPropertyOptional({ example: 'StrongPassword123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: never;

  @ApiPropertyOptional({ example: 'USER' })
  @IsOptional()
  role?: never;
}
