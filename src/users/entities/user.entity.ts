import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '@/database/base.entity';
import { UserRole } from '../enums/user-roles.enum';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  passwordResetExpires: Date;
}
