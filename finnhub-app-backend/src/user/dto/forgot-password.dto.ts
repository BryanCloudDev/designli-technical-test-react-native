import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data-transfer object for the forgot-password request.
 *
 * The email is normalised to lowercase and trimmed of surrounding whitespace
 * at the DTO layer via the `@Transform` decorator so that the service always
 * receives a consistently formatted value regardless of how the client sends
 * it.
 */
export class ForgotPasswordDto {
  /**
   * The email address associated with the account for which a password reset
   * is being requested.
   *
   * Must be a valid RFC 5322 email address. Normalised to lowercase and
   * trimmed before validation.
   */
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;
}
