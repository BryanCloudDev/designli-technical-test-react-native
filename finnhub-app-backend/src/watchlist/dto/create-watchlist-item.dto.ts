import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWatchlistItemDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock ticker symbol (1-5 uppercase letters)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(/^[A-Z]{1,5}$/, { message: 'symbol must be 1-5 uppercase letters (e.g. AAPL)' })
  @Transform(({ value }: { value: string }) => value.toUpperCase().trim())
  symbol: string;
}
