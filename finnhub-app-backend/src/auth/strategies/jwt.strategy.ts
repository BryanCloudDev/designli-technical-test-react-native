import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { exceptionHandler } from 'src/common/error/error-handler';
import { User } from 'src/user/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Passport strategy that validates incoming JWT Bearer tokens.
 *
 * Registered under the `'jwt'` strategy name so that {@link JwtAuthGuard}
 * (which extends `AuthGuard('jwt')`) can invoke it automatically.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  /**
   * Validates the decoded JWT payload and resolves the authenticated user.
   *
   * Called by Passport after verifying the token signature. The returned
   * value is attached to `req.user` by the framework.
   *
   * @param payload - The decoded JWT payload containing the user's UUID.
   * @returns The full {@link User} record (password excluded).
   * @throws {UnauthorizedException} When the payload is missing, the user
   *   does not exist, or the account has been deactivated.
   */
  async validate(payload: JwtPayload): Promise<User> {
    try {
      if (!payload?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw exceptionHandler(error);
    }
  }
}
