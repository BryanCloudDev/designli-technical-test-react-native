import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { exceptionHandler } from 'src/common/error/error-handler';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  private readonly logger = new Logger(JwtStrategy.name);

  async validate(payload: JwtPayload): Promise<boolean | undefined> {
    try {
      return new Promise((resolve, reject) => {
        if (!payload || !payload.id) {
          reject(new UnauthorizedException('Invalid token payload'));
        }
        resolve(true);
      });
    } catch (error) {
      exceptionHandler(error);
    }
  }
}
