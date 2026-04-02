import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  UnauthorizedException,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorators';
import { Roles } from 'src/common/decorators/roles.decorator';
import sendResponse from '../utils/sendResponse';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Auth')
@ApiBearerAuth('auth')
@ApiCookieAuth('access_token')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getAccessTokenCookieOptions(req: Request) {
    const origin = req.get('origin') ?? '';
    const isLocalhostOrigin = origin.includes('localhost');
    const isProductionCookie = Boolean(origin) && !isLocalhostOrigin;

    return {
      httpOnly: true,
      secure: isProductionCookie,
      sameSite: (isProductionCookie ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 365,
      path: '/',
    };
  }

  @Post('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create user' })
  async createUser(@Body() dto: CreateUserDto, @Res() res: Response) {
    const result = await this.authService.createUser(dto);

    return sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login user' })
  async loginUser(
    @Body() dto: LoginUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.loginUser(dto);
    res.cookie(
      'access_token',
      result.accessToken,
      this.getAccessTokenCookieOptions(req),
    );

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: result,
    });
  }

  @Post('logout')
  @Public()
  @ApiOperation({ summary: 'Logout user' })
  logoutUser(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('access_token', this.getAccessTokenCookieOptions(req));

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged out successfully',
      data: null,
    });
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Res() res: Response) {
    const result = await this.authService.getAllUsers();

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get logged in user' })
  async getMe(@Req() req: Request, @Res() res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const result = await this.authService.getSpecificUser(req.user.id, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Logged in user retrieved successfully',
      data: result,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get specific user' })
  async getSpecificUser(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.getSpecificUser(id, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: result,
    });
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update specific user' })
  async updateSpecificUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.updateSpecificUser(id, dto, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User updated successfully',
      data: result,
    });
  }

  @Patch('users/:id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Change role' })
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.changeRole(id, dto);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User role changed successfully',
      data: result,
    });
  }

  @Patch('users/:id/password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.changePassword(id, dto, req.user);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Password changed successfully',
      data: result,
    });
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    const result = await this.authService.deleteUser(id);

    return sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User deleted successfully',
      data: result,
    });
  }
}
