import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { ApplicationController } from './application.controller';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { CloudinaryConfig } from 'src/config/cloudinary.config';
@Module({
  controllers: [JobController, ApplicationController],
  providers: [JobService, CloudinaryService, CloudinaryConfig],
})
export class JobModule { }
