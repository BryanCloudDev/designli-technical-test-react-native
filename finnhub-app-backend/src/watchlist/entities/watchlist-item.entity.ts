import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';

@Entity()
@Unique(['userId', 'symbol'])
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Ticker symbol stored in uppercase (e.g. 'AAPL'). */
  @Column({ length: 10 })
  symbol: string;

  @CreateDateColumn()
  createdAt: Date;
}
