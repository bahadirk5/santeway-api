import { UserRole } from '@/users/enums/user-roles.enum';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
