import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '@/users/entities/user.entity';
import { TokenResponse } from './interfaces/tokens.interface';
import { JWT_CONSTANTS } from './constants/auth.constant';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  
  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.login(user);
  }

  async login(credentials: LoginDto | User): Promise<TokenResponse> {
    let user: User;

    if ('id' in credentials) {
      user = credentials;
    } else {
      user = await this.validateUser(credentials);
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Using email instead of id for finding user
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async validateUser(credentials: LoginDto): Promise<User> {
    const user = await this.usersService.findByEmail(credentials.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private generateTokens(user: User): TokenResponse {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRY_SEC,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  private generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRY,
      secret: process.env.JWT_SECRET,
    });
  }

  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: JWT_CONSTANTS.REFRESH_TOKEN_EXPIRY,
      secret: process.env.JWT_REFRESH_SECRET,
    });
  }
}
