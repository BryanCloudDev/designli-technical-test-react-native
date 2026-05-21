import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Authentication module.
 *
 * Configures Passport with the JWT default strategy and registers
 * {@link JwtStrategy} for token validation. Exposes {@link JwtAuthGuard}
 * so other modules can protect routes without re-declaring it.
 */
@Module({
  controllers: [],
  providers: [JwtStrategy, JwtAuthGuard],
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '12h',
        },
      }),
    }),
  ],
  exports: [JwtStrategy, JwtAuthGuard, PassportModule, JwtModule],
})
export class AuthModule {}
