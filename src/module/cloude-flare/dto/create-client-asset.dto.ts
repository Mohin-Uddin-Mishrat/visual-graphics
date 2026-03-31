import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateClientAssetDto {
 

  @ApiPropertyOptional({
    example: false,
    description: 'Track whether the asset has already been sent to the client',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return value;
  })
  @IsBoolean()
  isClientSent?: boolean;
}
