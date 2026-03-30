import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: '6b2a6a3f-0739-4ec2-a598-a074a68ee45d' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'https://example.com/resume/jane-doe.pdf' })
  @IsString()
  @IsNotEmpty()
  resumeLink: string;

  @ApiPropertyOptional({ example: 'I have 4 years of React experience.' })
  @IsOptional()
  @IsString()
  coverNote?: string;
}
