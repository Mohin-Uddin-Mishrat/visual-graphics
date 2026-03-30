import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientAssetDto } from './dto/create-client-asset.dto';
import { GetClientAssetsQueryDto } from './dto/get-client-assets-query.dto';

@Injectable()
export class CloudeFlareService {
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly publicBaseUrl?: string;
  private readonly s3Client: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.endpoint = this.configService.getOrThrow<string>('R2_ENDPOINT');
    this.publicBaseUrl =
      this.configService.get<string>('R2_PUBLIC_BASE_URL')?.trim() || undefined;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId:
          this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey:
          this.configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createClientAsset(
    dto: CreateClientAssetDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const upload = await this.uploadFile(file, 'client-assets');

    return this.prisma.client.clientAsset.create({
      data: {
        clientName: dto.clientName,
        imageUrl: upload.url,
        isClientSent: dto.isClientSent ?? false,
      },
    });
  }

  async getAllClientAssets(query: GetClientAssetsQueryDto) {
    return this.prisma.client.clientAsset.findMany({
      where:
        query.isClientSent === undefined
          ? undefined
          : { isClientSent: query.isClientSent },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteClientAsset(id: string) {
    const asset = await this.prisma.client.clientAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Client asset not found');
    }

    const objectKey = this.extractObjectKey(asset.imageUrl);
    await this.deleteFile(objectKey);

    await this.prisma.client.clientAsset.delete({
      where: { id },
    });

    return { id };
  }

  async downloadClientAsset(id: string) {
    const asset = await this.prisma.client.clientAsset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Client asset not found');
    }

    const objectKey = this.extractObjectKey(asset.imageUrl);

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );

      const body = response.Body?.transformToWebStream
        ? Readable.fromWeb(response.Body.transformToWebStream() as never)
        : (response.Body as Readable | undefined);

      if (!body) {
        throw new InternalServerErrorException('File body is empty');
      }

      return {
        body,
        contentType: response.ContentType || 'application/octet-stream',
        fileName: this.extractFileName(objectKey),
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to download file from Cloudflare R2',
      );
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'uploads') {
    const sanitizedFileName = this.sanitizeFileName(file.originalname);
    const objectKey = `${folder}/${Date.now()}-${sanitizedFileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to upload file to Cloudflare R2',
      );
    }

    return {
      key: objectKey,
      url: this.buildFileUrl(objectKey),
    };
  }

  async deleteFile(objectKey: string) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Failed to delete file from Cloudflare R2',
      );
    }
  }

  private buildFileUrl(objectKey: string) {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${objectKey}`;
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
  }

  private extractFileName(objectKey: string) {
    return objectKey.split('/').pop() || 'download';
  }

  private extractObjectKey(imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is missing');
    }

    const normalizedPublicBaseUrl = this.publicBaseUrl?.replace(/\/$/, '');
    const normalizedEndpoint = this.endpoint.replace(/\/$/, '');

    if (normalizedPublicBaseUrl?.length) {
      const publicPrefix = `${normalizedPublicBaseUrl}/`;

      if (imageUrl.startsWith(publicPrefix)) {
        return imageUrl.slice(publicPrefix.length);
      }
    }

    const privatePrefix = `${normalizedEndpoint}/${this.bucketName}/`;

    if (imageUrl.startsWith(privatePrefix)) {
      return imageUrl.slice(privatePrefix.length);
    }

    try {
      const parsedUrl = new URL(imageUrl);
      return parsedUrl.pathname.replace(/^\/+/, '').replace(
        new RegExp(`^${this.bucketName}/`),
        '',
      );
    } catch {
      throw new BadRequestException('Unable to determine Cloudflare file key');
    }
  }
}
