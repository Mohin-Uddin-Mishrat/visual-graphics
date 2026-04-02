import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from './strategy/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role ?? 'USER',
      },
    });

    // try {
    //   await this.mailService.sendNewUserCredentialsMail({
    //     email: user.email,
    //     password: dto.password,
    //     fullName: user.name,
    //   });
    // } catch (error) {
    //   const message =
    //     error instanceof Error ? error.message : 'Unknown mail error';

    //   this.logger.error(
    //     `Failed to send credentials email to ${user.email}: ${message}`,
    //     error instanceof Error ? error.stack : undefined,
    //   );

    //   await this.prisma.client.user.delete({
    //     where: { id: user.id },
    //   });

    //   throw new InternalServerErrorException(
    //     `User creation failed because the credentials email could not be sent: ${message}`,
    //   );
    // }

    return this.excludePassword(user);
  }

  async loginUser(dto: LoginUserDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatched = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.excludePassword(user),
    };
  }

  async getAllUsers() {
    const users = await this.prisma.client.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.excludePassword(user));
  }

  async getSpecificUser(id: string, currentUser?: JwtPayload) {
    this.ensureSelfOrAdmin(id, currentUser);

    const user = await this.findUserById(id);
    return this.excludePassword(user);
  }

  async updateSpecificUser(
    id: string,
    dto: UpdateUserDto,
    currentUser?: JwtPayload,
  ) {
    this.ensureSelfOrAdmin(id, currentUser);
    await this.findUserById(id);

    if (dto.email) {
      const existingUser = await this.prisma.client.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.client.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
      },
    });

    return this.excludePassword(updatedUser);
  }

  async changeRole(id: string, dto: ChangeRoleDto) {
    await this.findUserById(id);

    const updatedUser = await this.prisma.client.user.update({
      where: { id },
      data: {
        role: dto.role,
      },
    });

    return this.excludePassword(updatedUser);
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
    currentUser?: JwtPayload,
  ) {
    this.ensureSelfOrAdmin(id, currentUser);

    const user = await this.findUserById(id);

    if (currentUser?.role !== 'ADMIN') {
      if (!dto.oldPassword) {
        throw new BadRequestException('Old password is required');
      }

      const isOldPasswordMatched = await bcrypt.compare(
        dto.oldPassword,
        user.password,
      );

      if (!isOldPasswordMatched) {
        throw new BadRequestException('Old password is incorrect');
      }
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.client.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { id };
  }

  async deleteUser(id: string) {
    await this.findUserById(id);

    await this.prisma.client.user.delete({
      where: { id },
    });

    return { id };
  }

  private async findUserById(id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private ensureSelfOrAdmin(id: string, currentUser?: JwtPayload) {
    if (!currentUser) {
      throw new UnauthorizedException('Unauthorized access');
    }

    if (currentUser.role === 'ADMIN' || currentUser.id === id) {
      return;
    }

    throw new ForbiddenException('You are not allowed to access this user');
  }

  private excludePassword<T extends { password: string }>(user: T) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
