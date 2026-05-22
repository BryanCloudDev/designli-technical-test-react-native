import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.getOrThrow<string>(
            'FIREBASE_PROJECT_ID',
          ),
          clientEmail: this.configService.getOrThrow<string>(
            'FIREBASE_CLIENT_EMAIL',
          ),
          privateKey: this.configService
            .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
            .replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin SDK initialised');
    }
  }

  /**
   * Sends a price-alert push notification to a single device.
   *
   * Failures are logged but not re-thrown so that a bad/expired token does
   * not disrupt the polling loop that calls this method.
   *
   * @param fcmToken     - Device registration token obtained from the client.
   * @param symbol       - Ticker symbol that crossed the threshold (e.g. 'AAPL').
   * @param currentPrice - The price that triggered the alert.
   * @param targetPrice  - The user-configured alert threshold.
   */
  async sendPriceAlert(
    fcmToken: string,
    symbol: string,
    currentPrice: number,
    targetPrice: number,
  ): Promise<void> {
    try {
      await admin.messaging().send({
        notification: {
          title: `📈 Price Alert: ${symbol}`,
          body: `${symbol} has reached $${currentPrice.toFixed(2)} (your target: $${targetPrice.toFixed(2)})`,
        },
        android: {
          notification: { channelId: 'price-alerts' },
        },
        data: {
          symbol,
          currentPrice: String(currentPrice),
          targetPrice: String(targetPrice),
          type: 'price_alert',
        },
        token: fcmToken,
      });

      this.logger.log(
        `FCM alert sent — ${symbol} @ $${currentPrice.toFixed(2)} → token …${fcmToken.slice(-8)}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send FCM notification for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
