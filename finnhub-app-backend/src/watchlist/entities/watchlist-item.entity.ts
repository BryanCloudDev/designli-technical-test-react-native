import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Watchlist item UUID',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Owner user UUID',
  })
  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ApiProperty({ example: 'AAPL', description: 'Ticker symbol (uppercase)' })
  @Column({ length: 10 })
  symbol!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;
}
