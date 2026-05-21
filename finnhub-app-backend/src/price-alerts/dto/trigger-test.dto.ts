import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString, Matches, MaxLength } from 'class-validator';

export class TriggerTestDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock ticker symbol (1-5 uppercase letters)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(/^[A-Z]{1,5}$/, { message: 'symbol must be 1-5 uppercase letters' })
  @Transform(({ value }: { value: string }) => value.toUpperCase().trim())
  symbol!: string;

  @ApiProperty({ example: 250.0, description: 'Simulated current price sent to checkAndTrigger' })
  @IsNumber()
  @IsPositive()
  price!: number;
}
