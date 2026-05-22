import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationsService } from 'src/notifications/notifications.service';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { errorHandler } from 'src/common/error/error-handler';
import { PriceAlert } from './entities/price-alert.entity';
import { User } from 'src/user/entities/user.entity';

/**
 * Manages price alerts and triggers FCM notifications when thresholds are met.
 */
@Injectable()
export class PriceAlertsService {
  private readonly logger = new Logger(PriceAlertsService.name);

  constructor(
    @InjectRepository(PriceAlert)
    private readonly alertRepository: Repository<PriceAlert>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Creates a new price alert for the authenticated user.
   *
   * @param userId - UUID of the alert owner.
   * @param dto    - Validated payload containing symbol and target price.
   */
  async create(userId: string, dto: CreatePriceAlertDto): Promise<PriceAlert> {
    try {
      const alert = this.alertRepository.create({
        userId,
        symbol: dto.symbol,
        targetPrice: dto.targetPrice,
      });
      return await this.alertRepository.save(alert);
    } catch (error) {
      return errorHandler('Failed to create price alert', this.logger, error);
    }
  }

  /**
   * Returns all price alerts belonging to the authenticated user.
   *
   * @param userId - UUID of the requesting user.
   */
  async findAll(userId: string): Promise<PriceAlert[]> {
    try {
      return await this.alertRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      return errorHandler('Failed to fetch price alerts', this.logger, error);
    }
  }

  /**
   * Deletes a price alert owned by the authenticated user.
   *
   * @param id     - UUID of the alert to delete.
   * @param userId - UUID of the requesting user (ownership check).
   * @throws {NotFoundException} When the alert does not exist or belongs to another user.
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      const alert = await this.alertRepository.findOne({
        where: { id, userId },
      });

      if (!alert) {
        throw new NotFoundException('Price alert not found');
      }

      await this.alertRepository.remove(alert);
      return { message: 'Price alert removed successfully' };
    } catch (error) {
      return errorHandler('Failed to remove price alert', this.logger, error);
    }
  }

  /**
   * Returns the unique set of ticker symbols that have at least one pending
   * (non-triggered) alert. Used by StocksService to ensure every alerted
   * symbol is included in the polling loop regardless of what is shown on
   * the Markets screen.
   */
  async getPendingAlertSymbols(): Promise<string[]> {
    try {
      const alerts = await this.alertRepository.find({
        where: { isTriggered: false },
        select: { symbol: true },
      });
      return [...new Set(alerts.map((a) => a.symbol))];
    } catch (error) {
      return errorHandler(
        'Failed to fetch pending alert symbols',
        this.logger,
        error,
      );
    }
  }

  /**
   * Checks whether any non-triggered alert for `symbol` has been crossed by
   * the latest `price`. Called by StocksService on every polling cycle.
   *
   * For each crossed alert:
   *   1. Sends an FCM push notification if the user has a registered token.
   *   2. Marks the alert as triggered so it fires only once.
   *
   * @param symbol - Ticker symbol whose price was just updated.
   * @param price  - Latest known price for the symbol.
   */
  async checkAndTrigger(symbol: string, price: number): Promise<void> {
    try {
      const alerts = await this.alertRepository.find({
        where: { symbol: symbol.toUpperCase(), isTriggered: false },
      });

      if (alerts.length === 0) return;

      for (const alert of alerts) {
        if (price < Number(alert.targetPrice)) continue;

        const user = await this.userRepository.findOne({
          where: { id: alert.userId },
        });

        if (user?.fcmToken) {
          await this.notificationsService.sendPriceAlert(
            user.fcmToken,
            symbol,
            price,
            Number(alert.targetPrice),
          );
        } else {
          this.logger.warn(
            `Alert ${alert.id} triggered but user ${alert.userId} has no FCM token`,
          );
        }

        await this.alertRepository.update(alert.id, { isTriggered: true });
        this.logger.log(
          `Alert ${alert.id} triggered — ${symbol} @ $${price.toFixed(2)} ≥ $${Number(alert.targetPrice).toFixed(2)}`,
        );
      }
    } catch (error) {
      // Log but do not throw — a failure here must not break the polling loop
      this.logger.error(
        `checkAndTrigger failed for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
