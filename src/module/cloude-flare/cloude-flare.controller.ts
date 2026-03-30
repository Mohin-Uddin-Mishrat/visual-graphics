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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import sendResponse from '../utils/sendResponse';
import { CloudeFlareService } from './cloude-flare.service';
import { CreateClientAssetDto } from './dto/create-client-asset.dto';
import { GetClientAssetsQueryDto } from './dto/get-client-assets-query.dto';

@ApiTags('Cloudflare')
@Controller('cloude-flare')
export class CloudeFlareController {
  constructor(private readonly cloudeFlareService: CloudeFlareService) {}

  @Get('client-assets')
  @ApiOperation({ summary: 'Get all client assets' })
  async getAllClientAssets(
    @Query() query: GetClientAssetsQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.cloudeFlareService.getAllClientAssets(query);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Client assets retrieved successfully',
      data: result,
    });
  }

  @Get('client-assets/:id')
  @ApiOperation({ summary: 'Get a single client asset' })
  async getClientAssetById(@Param('id') id: string, @Res() res: Response) {
    const result = await this.cloudeFlareService.getClientAssetById(id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Client asset retrieved successfully',
      data: result,
    });
  }

  @Post('client-assets')
  @ApiOperation({ summary: 'Upload a client asset to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['clientName', 'file'],
      properties: {
        clientName: {
          type: 'string',
          example: 'Acme Corporation',
        },
        isClientSent: {
          type: 'boolean',
          example: false,
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async createClientAsset(
    @Body() dto: CreateClientAssetDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const result = await this.cloudeFlareService.createClientAsset(dto, file);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Client asset uploaded successfully',
      data: result,
    });
  }

  @Delete('client-assets/:id')
  @ApiOperation({ summary: 'Delete a client asset from Cloudflare R2' })
  async deleteClientAsset(@Param('id') id: string, @Res() res: Response) {
    const result = await this.cloudeFlareService.deleteClientAsset(id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Client asset deleted successfully',
      data: result,
    });
  }

  @Get('client-assets/:id/download')
  @ApiOperation({ summary: 'Download a client asset from Cloudflare R2' })
  @ApiProduces('application/octet-stream')
  async downloadClientAsset(@Param('id') id: string, @Res() res: Response) {
    const file = await this.cloudeFlareService.downloadClientAsset(id);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );

    file.body.pipe(res);
  }
}
