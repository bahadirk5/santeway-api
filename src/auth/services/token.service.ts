import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Token } from '../entities/token.entity';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  /**
   * Creates a token and saves it to the database
   * @param user User information
   * @param deviceInfo Device information (optional)
   * @param ipAddress IP address (optional)
   * @returns Token string
   */
  async generateToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    // Create a payload for JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token
    const expiresInDays = this.configService.get(
      'REFRESH_TOKEN_EXPIRATION_DAYS',
      7,
    );

    const tokenString = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: `${expiresInDays}d`, // Use configuration value for expiration
    });

    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    // Create new token record
    const token = this.tokenRepository.create({
      token: tokenString,
      userId: user.id,
      expires: expiresAt,
      deviceInfo,
      ipAddress,
      isRevoked: false,
    });

    try {
      await this.tokenRepository.save(token);
      return tokenString;
    } catch (error) {
      this.logger.error(
        `Token oluşturulurken hata: ${error.message}`,
        error.stack,
      );
      throw new Error('Token oluşturulamadı');
    }
  }

  /**
   * Validates a token
   * @param tokenString Token string
   * @returns User ID of the token owner
   * @throws UnauthorizedException
   */
  async validateToken(tokenString: string): Promise<string> {
    const token = await this.tokenRepository.findOne({
      where: { token: tokenString, isRevoked: false },
    });

    if (!token) {
      throw new UnauthorizedException('Geçersiz token');
    }

    if (token.isExpired()) {
      // Mark expired token
      await this.revokeToken(tokenString);
      throw new UnauthorizedException('Token süresi dolmuş');
    }

    return token.userId;
  }

  /**
   * Revokes a token
   * @param tokenString The token to revoke
   */
  async revokeToken(tokenString: string): Promise<void> {
    await this.tokenRepository.update(
      { token: tokenString },
      { isRevoked: true },
    );
  }

  /**
   * Revokes tokens for a specific user and device
   * @param userId User ID
   * @param deviceInfo Device information
   */
  async revokeTokensByDevice(
    userId: string,
    deviceInfo: string,
  ): Promise<void> {
    try {
      await this.tokenRepository.update(
        { userId, deviceInfo, isRevoked: false },
        { isRevoked: true },
      );
    } catch (error) {
      this.logger.error(`Error revoking tokens for device: ${error.message}`);
      // Silent failure - continue with login process
    }
  }

  /**
   * Revokes all tokens for a user
   * @param userId User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * Cleans up expired and unused tokens
   * (Can be used in a scheduled task)
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    try {
      await this.tokenRepository.delete({
        expires: { $lt: now } as any,
      });

      this.logger.log('Süresi dolmuş tokenler temizlendi');
    } catch (error) {
      this.logger.error('Token temizleme sırasında hata:', error.stack);
    }
  }

  /**
   * Creates an email verification token
   * @returns Email verification token
   */
  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Creates a password reset token
   * @returns Password reset token
   */
  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculates the expiration date for a password reset token
   * @returns Expiration date
   */
  getPasswordResetExpiration(): Date {
    const expiresInHours = this.configService.get(
      'PASSWORD_RESET_EXPIRES_HOURS',
      24,
    );
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expiresInHours);
    return expirationDate;
  }
}
