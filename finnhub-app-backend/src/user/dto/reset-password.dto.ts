import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Data-transfer object for the reset-password request.
 *
 * Carries the opaque reset token issued by {@link UserService.forgotPassword}
 * and the new password the user wants to set. The new password is subject to
 * the same complexity rules enforced during registration.
 */
export class ResetPasswordDto {
  /**
   * The raw (unhashed) reset token that was delivered to the user.
   *
   * The service hashes this value before looking it up in the database so
   * that only the hash is ever compared at rest.
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * The new plain-text password chosen by the user.
   *
   * Requirements:
   * - Minimum 8 characters.
   * - At least one uppercase letter.
   * - At least one lowercase letter.
   * - At least one numeric digit.
   * - At least one special character from `@$!%*?&`.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}
