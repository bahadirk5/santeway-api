import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

import { MailService } from '@/mail/mail.service';

import { UsersService } from '@/users/services/users.service';
import { UserStatus } from '@/users/enums/user-status.enum';

import { ResetPasswordDto, ForgotPasswordDto } from '../dto/reset-password.dto';
import { AuthResponse } from '../interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user
   * @param registerDto Registration information
   * @param deviceInfo Device information
   * @param ipAddress IP address
   * @returns Token information
   */
  async register(
    registerDto: RegisterDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('This email is already registered');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create verification token
    const emailVerificationToken =
      this.tokenService.generateEmailVerificationToken();

    // Create user
    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      status: UserStatus.PENDING,
      emailVerificationToken,
    });

    // Create verification link
    const verificationLink = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${emailVerificationToken}`;

    // Send verification email
    await this.mailService.sendVerificationEmail(
      newUser.email,
      newUser.firstName,
      verificationLink,
    );

    // Create token
    const token = await this.tokenService.generateToken(
      newUser,
      deviceInfo,
      ipAddress,
    );

    return { token };
  }

  /**
   * Authenticates a user
   * @param loginDto Login information
   * @param deviceInfo Device information
   * @param ipAddress IP address
   * @returns Token information
   */
  async login(
    loginDto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('This account has been banned');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('This account is temporarily suspended');
    }

    // Check if we should revoke existing sessions from same device
    if (deviceInfo) {
      // Find tokens for this device and revoke them
      await this.tokenService.revokeTokensByDevice(user.id, deviceInfo);
    }

    // Create token
    const token = await this.tokenService.generateToken(
      user,
      deviceInfo,
      ipAddress,
    );

    return { token };
  }

  /**
   * Logs out a user
   * @param token Token
   */
  async logout(token: string): Promise<void> {
    try {
      await this.tokenService.revokeToken(token);
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      // Silent failure - no need to return an error to the client
    }
  }

  /**
   * Logs out from all devices
   * @param userId User ID
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await this.tokenService.revokeAllUserTokens(userId);
    } catch (error) {
      this.logger.error(`Error logging out from all devices: ${error.message}`);
      throw new Error('An error occurred while logging out from all devices');
    }
  }

  /**
   * Verifies email address
   * @param token Verification token
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersService.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Mark email as verified and user as active
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
    });
  }

  /**
   * Creates a password reset request
   * @param forgotPasswordDto Email information
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // For security reasons, we return success even if the user is not found
      return;
    }

    const resetToken = this.tokenService.generatePasswordResetToken();
    const resetExpires = this.tokenService.getPasswordResetExpiration();

    await this.usersService.setPasswordResetToken(
      user.id,
      resetToken,
      resetExpires,
    );

    // Create password reset link
    const resetLink = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetLink,
    );
  }

  /**
   * Resets a password
   * @param resetPasswordDto Password reset information
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(resetPasswordDto.password);

    // Update password and revoke all tokens (for security)
    await this.usersService.resetPassword(user.id, hashedPassword);
    await this.tokenService.revokeAllUserTokens(user.id);
  }

  /**
   * Password hashing function
   * @param password Plain password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Password validation function
   * @param plainPassword Plain password
   * @param hashedPassword Hashed password
   * @returns Match status
   */
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
