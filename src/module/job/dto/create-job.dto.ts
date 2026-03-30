import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Acme Inc.' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'Remote' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Build and maintain web applications.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  logo?: any;
}
