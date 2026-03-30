import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { GetAllJobsQueryDto } from './dto/get-all-jobs-query.dto';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async getAllApplications() {
    return this.prisma.client.application.findMany({
      include: {
        job: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllJobs(query: GetAllJobsQueryDto) {
    const search = query.search?.trim();
    const category = query.category?.trim();
    const location = query.location?.trim();

    return this.prisma.client.job.findMany({
      where: {
        ...(category
          ? { category: { contains: category, mode: 'insensitive' } }
          : {}),
        ...(location
          ? { location: { contains: location, mode: 'insensitive' } }
          : {}),
        ...(search
          ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getJobById(id: string) {
    const job = await this.prisma.client.job.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async createJob(dto: CreateJobDto, file?: Express.Multer.File) {
    let logoUrl = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        'job-logos',
      );
      logoUrl = uploadResult.secure_url;
    }

    const { logo, ...jobData } = dto;

    return this.prisma.client.job.create({
      data: {
        ...jobData,
        logo: logoUrl,
      },
    });
  }

  async deleteJob(id: string) {
    const job = await this.prisma.client.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.client.job.delete({
      where: { id },
    });

    return { id };
  }

  async createApplication(dto: CreateApplicationDto) {
    const job = await this.prisma.client.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingApplication = await this.prisma.client.application.findFirst({
      where: {
        jobId: dto.jobId,
        email: normalizedEmail,
      },
    });

    if (existingApplication) {
      throw new BadRequestException(
        'This email has already applied for this job',
      );
    }

    return this.prisma.client.application.create({
      data: {
        jobId: dto.jobId,
        name: dto.name,
        email: normalizedEmail,
        resumeLink: dto.resumeLink,
        coverNote: dto.coverNote,
      },
    });
  }
}
