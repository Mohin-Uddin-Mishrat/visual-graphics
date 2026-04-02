import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthSeeder implements OnModuleInit {
  private readonly logger = new Logger(AuthSeeder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const email = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    const password = this.configService.get<string>('ADMIN_PASSWORD')?.trim();
    const fullName = this.configService.get<string>('ADMIN_FULL_NAME')?.trim();
    const saltRounds = Number(this.configService.get<string>('SALT_ROUND') || 10);

    if (!email || !password || !fullName) {
      this.logger.warn(
        'Admin seeding skipped because ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_FULL_NAME is missing',
      );
      return;
    }

    const existingAdmin = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        await this.prisma.client.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });

        this.logger.log(`Existing user promoted to ADMIN: ${email}`);
        return;
      }

      this.logger.log(`Admin already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await this.prisma.client.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    this.logger.log(`Admin user created: ${email}`);
  }
}
