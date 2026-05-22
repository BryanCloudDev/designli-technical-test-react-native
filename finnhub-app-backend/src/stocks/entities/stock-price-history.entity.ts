import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stock_price_history')
@Index('IDX_stock_price_history_symbol_timestamp', ['symbol', 'timestamp'])
export class StockPriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  symbol: string;

  /** Unix timestamp in milliseconds stored as bigint */
  @Column('bigint', {
    transformer: {
      from: (v: string) => Number(v),
      to: (v: number) => v,
    },
  })
  timestamp: number;

  @Column('decimal', { precision: 12, scale: 4 })
  price: number;
}
