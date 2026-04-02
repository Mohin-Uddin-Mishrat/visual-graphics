import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { type StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthSeeder } from './auth.seeder';
import { AuthService } from './auth.service';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret',
        signOptions: {
          expiresIn:
            (configService.get<string>('JWT_EXPIRES_IN') as StringValue) ||
            '300d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSeeder, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
