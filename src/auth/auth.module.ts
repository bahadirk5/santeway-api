import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

// Services
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { TokenCleanupService } from './services/token-cleanup.service';

// Controllers
import { AuthController } from './controllers/auth.controller';

// Entities
import { Token } from './entities/token.entity';

// Guards and Strategies
import { TokenAuthGuard } from './guards/token-auth.guard';
import { TokenStrategy } from './strategies/token.strategy';

// Modules
import { UsersModule } from '@/users/users.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    ConfigModule,
    JwtModule.register({}), // Empty config as we'll use ConfigService to get JWT_SECRET
    UsersModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    TokenCleanupService,
    TokenStrategy,
    {
      provide: APP_GUARD,
      useClass: TokenAuthGuard,
    },
  ],
  exports: [TokenService, AuthService],
})
export class AuthModule {}
