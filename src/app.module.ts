import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './module/prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobModule } from './module/job/job.module';
import { CloudeFlareModule } from './module/cloude-flare/cloude-flare.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    JobModule,
    CloudeFlareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
