import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAllJobsQueryDto {
  @ApiPropertyOptional({
    example: 'frontend',
    description: 'Search in title, company, and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'Engineering',
    description: 'Filter by category',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'Remote',
    description: 'Filter by location',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
