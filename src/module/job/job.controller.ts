import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorators';
import sendResponse from '../utils/sendResponse';
import { CreateJobDto } from './dto/create-job.dto';
import { GetAllJobsQueryDto } from './dto/get-all-jobs-query.dto';
import { JobService } from './job.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all jobs' })
  async getAllJobs(@Query() query: GetAllJobsQueryDto, @Res() res: Response) {
    const result = await this.jobService.getAllJobs(query);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Jobs retrieved successfully',
      data: result,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get single job details' })
  async getJobById(@Param('id') id: string, @Res() res: Response) {
    const result = await this.jobService.getJobById(id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Job retrieved successfully',
      data: result,
    });
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job (Admin)' })
  async deleteJob(@Param('id') id: string, @Res() res: Response) {
    const result = await this.jobService.deleteJob(id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Job deleted successfully',
      data: result,
    });
  }
}
