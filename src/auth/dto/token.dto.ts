import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token cannot be empty' })
  token: string;
}
