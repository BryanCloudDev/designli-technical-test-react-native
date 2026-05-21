import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Auth } from 'src/auth/decorators/auth.decorator';
import { StocksService } from './stocks.service';

/**
 * REST controller that exposes stock-data endpoints under `/stocks`.
 *
 * All routes require a valid JWT (Bearer token).
 *
 * Endpoints:
 * - `GET /stocks`                          — random selection of stocks with live quotes.
 * - `GET /stocks/search?q=`               — symbol / company-name search.
 * - `GET /stocks/:symbol/quote`           — live quote for a single symbol.
 * - `GET /stocks/:symbol/price-history`   — accumulated price-over-time for charting.
 */
@ApiTags('Stocks')
@Auth()
@Controller('stocks')
export class StocksController {
  private readonly logger = new Logger(StocksController.name);

  constructor(private readonly stocksService: StocksService) {}

  /**
   * Returns the default watchlist of popular stocks, each enriched with the
   * current price, change, and percent-change from Finnhub's quote endpoint.
   */
  @Get()
  @ApiOperation({ summary: 'Get popular stocks with current quotes' })
  getStockList() {
    return this.stocksService.getStockList();
  }

  /**
   * Full-text search for stocks by symbol or company name.
   * Returns up to 10 matches from Finnhub's symbol-search endpoint.
   *
   * @param query - Partial symbol or company name to search for.
   */
  @Get('search')
  @ApiOperation({ summary: 'Search stocks by symbol or company name' })
  @ApiQuery({
    name: 'q',
    description: 'Search term (symbol or company name)',
    example: 'Apple',
  })
  searchSymbol(@Query('q') query: string) {
    return this.stocksService.searchSymbol(query);
  }

  /**
   * Returns the latest quote for a single ticker symbol.
   *
   * @param symbol - Ticker symbol, e.g. `AAPL`.
   */
  @Get(':symbol/quote')
  @ApiOperation({ summary: 'Get current quote for a single stock' })
  @ApiParam({ name: 'symbol', description: 'Ticker symbol', example: 'AAPL' })
  getQuote(@Param('symbol') symbol: string) {
    return this.stocksService.getQuote(symbol);
  }

  /**
   * Returns accumulated price-over-time data for a symbol.
   * This is the free alternative to the premium candle endpoint.
   * Data is built from two sources:
   *   1. Real-time WebSocket trades (market hours).
   *   2. Periodic quote polling every 2 minutes (always active).
   * Up to 200 data points are kept (~6.5 hours of history at 2-min resolution).
   *
   * @param symbol - Ticker symbol, e.g. `AAPL`.
   */
  @Get(':symbol/price-history')
  @ApiOperation({
    summary: 'Get price-over-time history for charting (free tier)',
  })
  @ApiParam({ name: 'symbol', description: 'Ticker symbol', example: 'AAPL' })
  getPriceHistory(@Param('symbol') symbol: string) {
    return this.stocksService.getPriceHistory(symbol);
  }
}
