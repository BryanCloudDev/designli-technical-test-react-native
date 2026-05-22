import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';

@Entity()
export class PriceAlert {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Alert UUID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Owner user UUID',
  })
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: 'AAPL',
    description: 'Ticker symbol (1-5 uppercase letters)',
  })
  @Column({ length: 10 })
  symbol: string;

  @ApiProperty({
    example: 150.5,
    description: 'Price threshold that triggers the notification',
  })
  @Column('decimal', { precision: 12, scale: 4 })
  targetPrice: number;

  @ApiProperty({
    example: false,
    description:
      'True after the notification has fired — prevents duplicate alerts',
  })
  @Column({ default: false })
  isTriggered: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;
}
