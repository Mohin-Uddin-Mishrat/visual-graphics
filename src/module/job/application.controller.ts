import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorators';
import sendResponse from '../utils/sendResponse';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JobService } from './job.service';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  @ApiOperation({ summary: 'List all applications' })
  async getAllApplications(@Res() res: Response) {
    const result = await this.jobService.getAllApplications();

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Applications retrieved successfully',
      data: result,
    });
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Submit job application' })
  async createApplication(
    @Body() dto: CreateApplicationDto,
    @Res() res: Response,
  ) {
    const result = await this.jobService.createApplication(dto);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Application submitted successfully',
      data: result,
    });
  }
}
