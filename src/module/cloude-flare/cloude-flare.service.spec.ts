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

  it('uploads client-sent assets to the order folder', async () => {
    const file = {
      originalname: 'assets.zip',
      mimetype: 'application/zip',
      buffer: Buffer.from('zip'),
    } as Express.Multer.File;

    const storedAsset = {
      id: 1,
      imageUrl: 'https://cdn.example.com/order/assets.zip',
      isClientSent: true,
    };

    jest.spyOn(service, 'uploadFile').mockResolvedValue({
      key: 'order/assets.zip',
      url: storedAsset.imageUrl,
    });
    createMock.mockResolvedValue(storedAsset);

    await expect(service.createClientAsset({ isClientSent: true }, file)).resolves.toEqual(storedAsset);
    expect(service.uploadFile).toHaveBeenCalledWith(file, 'order');
  });

  it('uploads non-client-sent assets to the edited folder', async () => {
    const file = {
      originalname: 'demo.webp',
      mimetype: 'image/webp',
      buffer: Buffer.from('image'),
    } as Express.Multer.File;

    const storedAsset = {
      id: 2,
      imageUrl: 'https://cdn.example.com/edited/demo.webp',
      isClientSent: false,
    };

    jest.spyOn(service, 'uploadFile').mockResolvedValue({
      key: 'edited/demo.webp',
      url: storedAsset.imageUrl,
    });
    createMock.mockResolvedValue(storedAsset);

    await expect(
      service.createClientAsset({ isClientSent: false }, file),
    ).resolves.toEqual(storedAsset);
    expect(service.uploadFile).toHaveBeenCalledWith(file, 'edited');
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
