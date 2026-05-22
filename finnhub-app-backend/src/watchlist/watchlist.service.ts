import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateWatchlistItemDto } from './dto/create-watchlist-item.dto';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { errorHandler } from 'src/common/error/error-handler';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    @InjectRepository(WatchlistItem)
    private readonly watchlistRepository: Repository<WatchlistItem>,
  ) {}

  async add(
    userId: string,
    dto: CreateWatchlistItemDto,
  ): Promise<WatchlistItem> {
    try {
      const existing = await this.watchlistRepository.findOne({
        where: { userId, symbol: dto.symbol },
      });
      if (existing)
        throw new ConflictException('Stock is already in your watchlist');

      const item = this.watchlistRepository.create({
        userId,
        symbol: dto.symbol,
      });
      return await this.watchlistRepository.save(item);
    } catch (error) {
      return errorHandler(
        'Failed to add stock to watchlist',
        this.logger,
        error,
      );
    }
  }

  async findAll(userId: string): Promise<WatchlistItem[]> {
    try {
      return await this.watchlistRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      return errorHandler('Failed to fetch watchlist', this.logger, error);
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      const item = await this.watchlistRepository.findOne({
        where: { id, userId },
      });
      if (!item) throw new NotFoundException('Watchlist item not found');

      await this.watchlistRepository.remove(item);
      return { message: 'Stock removed from watchlist' };
    } catch (error) {
      return errorHandler(
        'Failed to remove stock from watchlist',
        this.logger,
        error,
      );
    }
  }
}
