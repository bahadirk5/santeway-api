import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '../enums/user-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
      },
      where: { id },
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async verifyEmail(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    user.isEmailVerified = true;
    user.status = UserStatus.ACTIVE;
    user.emailVerificationToken = null;
    return this.usersRepository.save(user);
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expiration: Date,
  ): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    user.passwordResetToken = token;
    user.passwordResetExpires = expiration;
    return this.usersRepository.save(user);
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    return this.usersRepository.save(user);
  }

  async update(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }
}
