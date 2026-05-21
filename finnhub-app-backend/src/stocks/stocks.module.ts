import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { StocksController } from './stocks.controller';
import { StocksGateway } from './stocks.gateway';
import { StocksService } from './stocks.service';

@Module({
  imports: [CommonModule, ConfigModule, AuthModule],
  controllers: [StocksController],
  providers: [StocksService, StocksGateway],
})
export class StocksModule {}
