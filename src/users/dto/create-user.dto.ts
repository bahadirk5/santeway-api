import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsEnum, 
  IsOptional 
} from 'class-validator';
import { UserRole } from '@/common/enums/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
