import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { NotificationsModule } from './notifications/notifications.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { JoiValidationSchema } from './common/config/joi.validation';
import { WatchlistModule } from './watchlist/watchlist.module';
import { envConfiguration } from './common/config/env.config';
import { StocksModule } from './stocks/stocks.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [envConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ThrottlerModule.forRoot([
      {
        // TTL is 15 minutes
        ttl: 900000,
        // Limit requests up to 100 per minute per IP
        limit: 100,
      },
    ]),
    AuthModule,
    UserModule,
    StocksModule,
    NotificationsModule,
    PriceAlertsModule,
    WatchlistModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
