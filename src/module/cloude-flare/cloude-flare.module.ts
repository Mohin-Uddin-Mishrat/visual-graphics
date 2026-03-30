import { Module } from '@nestjs/common';
import { CloudeFlareController } from './cloude-flare.controller';
import { CloudeFlareService } from './cloude-flare.service';

@Module({
  controllers: [CloudeFlareController],
  providers: [CloudeFlareService],
  exports: [CloudeFlareService],
})
export class CloudeFlareModule {}
