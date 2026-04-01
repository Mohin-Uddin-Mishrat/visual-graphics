import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CloudeFlareService } from './cloude-flare.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('CloudeFlareService', () => {
  let service: CloudeFlareService;

  const createMock = jest.fn();

  const prismaServiceMock = {
    client: {
      clientAsset: {
        create: createMock,
      },
    },
  };

  const configValues: Record<string, string> = {
    R2_BUCKET_NAME: 'bucket',
    R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    R2_ACCESS_KEY_ID: 'access-key',
    R2_SECRET_ACCESS_KEY: 'secret-key',
  };

  const configServiceMock = {
    get: jest.fn((key: string) => configValues[key]),
    getOrThrow: jest.fn((key: string) => configValues[key]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudeFlareService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<CloudeFlareService>(CloudeFlareService);
  });

  it('accepts zip uploads', async () => {
    const file = {
      originalname: 'assets.zip',
      mimetype: 'application/zip',
      buffer: Buffer.from('zip'),
    } as Express.Multer.File;

    const storedAsset = {
      id: 'asset-id',
      imageUrl: 'https://cdn.example.com/client-assets/assets.zip',
      isClientSent: false,
    };

    jest.spyOn(service, 'uploadFile').mockResolvedValue({
      key: 'client-assets/assets.zip',
      url: storedAsset.imageUrl,
    });
    createMock.mockResolvedValue(storedAsset);

    await expect(
      service.createClientAsset({ isClientSent: false }, file),
    ).resolves.toEqual(storedAsset);
  });

  it('rejects unsupported file types', async () => {
    const file = {
      originalname: 'notes.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('hello'),
    } as Express.Multer.File;

    await expect(service.createClientAsset({}, file)).rejects.toThrow(
      new BadRequestException('Only image and zip files are allowed'),
    );
  });
});
