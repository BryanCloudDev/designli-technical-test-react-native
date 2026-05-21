import { Body, Controller, Logger, Post } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserService } from './user.service';

/**
 * REST controller that exposes user-related endpoints under the `/user` path.
 *
 * Endpoints:
 * - `POST /user/register` — create a new account and receive a JWT.
 * - `POST /user/login` — authenticate and receive a JWT.
 * - `POST /user/forgot-password` — initiate a password-reset flow.
 * - `POST /user/reset-password` — validate a reset token and set a new password.
 */
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Registers a new user account.
   *
   * @param createUserDto - Validated registration data from the request body.
   * @returns An object containing the signed JWT string.
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<{ token: string }> {
    return this.userService.register(createUserDto);
  }

  /**
   * Authenticates a user and returns a signed JWT.
   *
   * @param dto - Validated payload containing email and password.
   * @returns An object containing the signed JWT string.
   * @throws {UnauthorizedException} When the credentials are invalid.
   */
  @Post('login')
  login(@Body() dto: LoginDto): Promise<{ token: string }> {
    return this.userService.login(dto);
  }

  /**
   * Initiates a password-reset request for the supplied email address.
   *
   * Returns the same generic message whether or not the email is registered
   * to prevent user-enumeration attacks.
   *
   * **Development only:** `resetToken` is included in the response body for
   * local testing. In production, this should be removed and deliver the token via email.
   *
   * @param dto - Validated payload containing the target email address.
   * @returns A generic success message and, in development, the raw reset token.
   */
  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken: string }> {
    return this.userService.forgotPassword(dto);
  }

  /**
   * Validates a password-reset token and updates the user's password.
   *
   * The token is hashed before the database lookup. It is marked as used
   * after a successful reset to prevent replay attacks.
   *
   * @param dto - Validated payload containing the raw token and the new password.
   * @returns A success message confirming the password was changed.
   * @throws {NotFoundException} When the token does not exist or has already been used.
   * @throws {BadRequestException} When the token has expired.
   */
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.userService.resetPassword(dto);
  }
}
