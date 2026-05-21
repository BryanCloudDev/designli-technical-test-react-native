import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /**
   * The user's registered email address.
   */
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;

  /**
   * The user's plain-text password.
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
