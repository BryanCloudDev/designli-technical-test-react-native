import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';

/**
 * Represents a user-defined price threshold for a stock symbol.
 *
 * When the symbol's market price reaches or exceeds `targetPrice`, an FCM
 * push notification is sent to the user's device and `isTriggered` is set to
 * `true` so that the alert fires exactly once.
 */
@Entity()
export class PriceAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Foreign key linking the alert to its owner. */
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Ticker symbol the alert monitors (e.g. 'AAPL'). Stored in uppercase. */
  @Column({ length: 10 })
  symbol: string;

  /** Price threshold that triggers the notification. */
  @Column('decimal', { precision: 12, scale: 4 })
  targetPrice: number;

  /**
   * Set to `true` after the notification has been sent.
   * Prevents the same alert from firing more than once.
   */
  @Column({ default: false })
  isTriggered: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
