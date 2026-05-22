import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
