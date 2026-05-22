import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { StockPriceHistory } from './entities/stock-price-history.entity';
import { PriceAlertsModule } from 'src/price-alerts/price-alerts.module';
import { CommonModule } from 'src/common/common.module';
import { StocksController } from './stocks.controller';
import { AuthModule } from 'src/auth/auth.module';
import { StocksGateway } from './stocks.gateway';
import { StocksService } from './stocks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockPriceHistory]),
    CommonModule,
    ConfigModule,
    AuthModule,
    PriceAlertsModule,
  ],
  controllers: [StocksController],
  providers: [StocksService, StocksGateway],
})
export class StocksModule {}
