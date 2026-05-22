import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { StocksService } from './stocks.service';

@ApiTags('Stocks')
@Auth()
@Controller('stocks')
export class StocksController {
  private readonly logger = new Logger(StocksController.name);

  constructor(private readonly stocksService: StocksService) {}

  @Get()
  @ApiOperation({ summary: 'Get popular stocks with current quotes' })
  @ApiOkResponse({
    description: 'Array of StockQuote objects with live price data',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'AAPL' },
          name: { type: 'string', example: 'Apple Inc' },
          currentPrice: { type: 'number', example: 182.63 },
          change: { type: 'number', example: 1.25 },
          percentChange: { type: 'number', example: 0.69 },
          high: { type: 'number', example: 183.5 },
          low: { type: 'number', example: 181.2 },
          open: { type: 'number', example: 181.8 },
          previousClose: { type: 'number', example: 181.38 },
          timestamp: { type: 'number', example: 1705315200 },
        },
      },
    },
  })
  getStockList() {
    return this.stocksService.getStockList();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stocks by symbol or company name' })
  @ApiQuery({
    name: 'q',
    description: 'Search term (symbol or company name)',
    example: 'Apple',
  })
  @ApiOkResponse({
    description: 'Up to 10 matching stocks',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          symbol: { type: 'string', example: 'AAPL' },
          name: { type: 'string', example: 'Apple Inc' },
          type: { type: 'string', example: 'Common Stock' },
        },
      },
    },
  })
  searchSymbol(@Query('q') query: string) {
    return this.stocksService.searchSymbol(query);
  }

  @Get(':symbol/quote')
  @ApiOperation({ summary: 'Get current quote for a single stock' })
  @ApiParam({ name: 'symbol', description: 'Ticker symbol', example: 'AAPL' })
  @ApiOkResponse({
    description: 'Live quote for the requested symbol',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', example: 'AAPL' },
        name: { type: 'string', example: 'Apple Inc' },
        currentPrice: { type: 'number', example: 182.63 },
        change: { type: 'number', example: 1.25 },
        percentChange: { type: 'number', example: 0.69 },
        high: { type: 'number', example: 183.5 },
        low: { type: 'number', example: 181.2 },
        open: { type: 'number', example: 181.8 },
        previousClose: { type: 'number', example: 181.38 },
        timestamp: { type: 'number', example: 1705315200 },
      },
    },
  })
  getQuote(@Param('symbol') symbol: string) {
    return this.stocksService.getQuote(symbol);
  }

  @Get(':symbol/price-history')
  @ApiOperation({
    summary: 'Get price-over-time history for charting (free tier)',
  })
  @ApiParam({ name: 'symbol', description: 'Ticker symbol', example: 'AAPL' })
  @ApiOkResponse({
    description:
      'Chronological price points (up to 200, ~6.5 h at 2-min resolution)',
    schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', example: 'AAPL' },
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'number',
                example: 1705315200000,
                description: 'Unix timestamp in ms',
              },
              price: { type: 'number', example: 182.63 },
            },
          },
        },
      },
    },
  })
  getPriceHistory(@Param('symbol') symbol: string) {
    return this.stocksService.getPriceHistory(symbol);
  }
}
