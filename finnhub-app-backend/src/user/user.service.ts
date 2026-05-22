import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { PasswordResetToken } from './entities/password-reset-token.entity';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';
import { errorHandler } from 'src/common/error/error-handler';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and returns a signed JWT for immediate authentication.
   *
   * Steps:
   * 1. Verify the email address is not already taken.
   * 2. Hash the plain-text password with bcrypt (10 salt rounds).
   * 3. Persist the new user entity.
   * 4. Sign a JWT containing the user's UUID as `{ id }`.
   * 5. Return the token to the caller.
   *
   * @param createUserDto - Validated and sanitised registration payload.
   * @returns An object containing the signed JWT string.
   * @throws {ConflictException} When the email address is already registered.
   * @throws {InternalServerErrorException} On any unexpected persistence or signing error.
   */
  async register(createUserDto: CreateUserDto): Promise<{ token: string }> {
    try {
      const { password, ...rest } = createUserDto;

      const existing = await this.userRepository.findOne({
        where: { email: rest.email },
      });

      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = this.userRepository.create({
        ...rest,
        password: hashedPassword,
      });

      await this.userRepository.save(user);

      const payload: JwtPayload = { id: user.id };
      const token = this.jwtService.sign(payload);

      return { token };
    } catch (error) {
      return errorHandler('Failed to register user', this.logger, error);
    }
  }

  /**
   * Authenticates a user with email and password.
   *
   * The password column is excluded from queries by default (`select: false`),
   * so it is explicitly re-selected here for the bcrypt comparison only.
   *
   * @param dto - Validated login payload containing email and password.
   * @returns An object containing a signed JWT string.
   * @throws {UnauthorizedException} When the email is not found or the password does not match.
   * @throws {InternalServerErrorException} On any unexpected error.
   */
  async login(dto: LoginDto): Promise<{ token: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: dto.email },
        select: { id: true, email: true, password: true },
      });

      if (!user || !(await bcrypt.compare(dto.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = { id: user.id };
      const token = this.jwtService.sign(payload);

      return { token };
    } catch (error) {
      return errorHandler('Failed to login', this.logger, error);
    }
  }

  /**
   * Initiates a password-reset flow for the given email address.
   *
   * A SHA-256 hash of a cryptographically random 32-byte token is stored in
   * the database. Any previously active (unused) tokens for the same user are
   * invalidated before the new one is created, preventing token accumulation.
   *
   * **Security note — no user enumeration:** If the email address is not found
   * the method returns the same generic success response as when it is found,
   * so that an attacker cannot determine whether a particular email is
   * registered.
   *
   * **Development only:** The raw token is included in the return value and
   * logged at WARN level so that it can be used during local testing without
   * an email provider. In production this value MUST be removed from the
   * response and delivered exclusively via a transactional email.
   *
   * @param dto - Validated forgot-password payload containing the target email.
   * @returns An object with a generic success message and, for development
   *   purposes only, the raw reset token. In production the `resetToken` field
   *   must be stripped and sent via email instead.
   * @throws {InternalServerErrorException} On any unexpected database error.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken: string }> {
    try {
      const genericResponse = {
        message:
          'If that email is registered you will receive a reset link shortly',
        resetToken: '',
      };

      const user = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (!user) {
        return genericResponse;
      }

      await this.tokenRepository.update(
        { userId: user.id, used: false },
        { used: true },
      );

      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      const tokenRecord = this.tokenRepository.create({
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await this.tokenRepository.save(tokenRecord);

      this.logger.warn(
        `[DEV ONLY] Password reset token for ${dto.email}: ${rawToken}`,
      );

      return {
        message:
          'If that email is registered you will receive a reset link shortly',
        resetToken: rawToken,
      };
    } catch (error) {
      return errorHandler(
        'Failed to process password reset request',
        this.logger,
        error,
      );
    }
  }

  /**
   * Validates a password-reset token and sets the user's new password.
   *
   * Steps:
   * 1. Hash the incoming raw token with SHA-256.
   * 2. Look up a matching, unused {@link PasswordResetToken} record.
   * 3. Reject the request if the token has passed its expiry timestamp.
   * 4. Hash the new password with bcrypt (10 salt rounds).
   * 5. Persist the new password hash on the user row.
   * 6. Mark the token record as used to prevent replay attacks.
   *
   * @param dto - Validated reset-password payload containing the raw token and
   *   the new password.
   * @returns A success message confirming the password was changed.
   * @throws {NotFoundException} When no valid (unused) token matches the
   *   provided value.
   * @throws {BadRequestException} When the matching token has expired.
   * @throws {InternalServerErrorException} On any unexpected database error.
   */
  /**
   * Stores (or updates) the FCM device token for push notifications.
   *
   * Called by the React Native client immediately after login or when the
   * FCM token is refreshed. Only the authenticated user can update their
   * own token.
   *
   * @param userId - UUID of the authenticated user.
   * @param dto    - Payload containing the raw FCM token string.
   * @returns A generic success message.
   */
  async registerFcmToken(
    userId: string,
    dto: RegisterFcmTokenDto,
  ): Promise<{ message: string }> {
    try {
      await this.userRepository.update({ id: userId }, { fcmToken: dto.token });
      return { message: 'FCM token registered successfully' };
    } catch (error) {
      return errorHandler('Failed to register FCM token', this.logger, error);
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const tokenHash = createHash('sha256').update(dto.token).digest('hex');

      const tokenRecord = await this.tokenRepository.findOne({
        where: { tokenHash, used: false },
      });

      if (!tokenRecord) {
        throw new NotFoundException('Reset token not found or already used');
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.userRepository.update(
        { id: tokenRecord.userId },
        { password: hashedPassword },
      );

      await this.tokenRepository.update({ id: tokenRecord.id }, { used: true });

      return { message: 'Password reset successfully' };
    } catch (error) {
      return errorHandler('Failed to reset password', this.logger, error);
    }
  }
}
