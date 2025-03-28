import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Ip,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto/reset-password.dto';

import { TokenAuthGuard } from '../guards/token-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { Public } from '../decorators/public.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    return this.authService.register(registerDto, deviceInfo, ip);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
  ) {
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, deviceInfo, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenAuthGuard)
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    await this.authService.logout(token);
    return { message: 'Successfully logged out' };
  }

  @Post('logout-all')
  @UseGuards(TokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAll(user.id);
    return { message: 'Successfully logged out from all devices' };
  }

  @Get('me')
  @UseGuards(TokenAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    const {
      password,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userResponse
    } = user;
    return userResponse;
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'Password reset instructions have been sent to your email',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Your password has been successfully reset' };
  }
}
