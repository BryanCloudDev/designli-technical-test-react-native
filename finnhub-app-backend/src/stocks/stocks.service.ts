import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { errorHandler } from 'src/common/error/error-handler';
import { HttpClient } from 'src/common/http/http-client';
import {
  FinnhubQuote,
  FinnhubStockSymbol,
  StockQuote,
} from './interfaces/quote.interface';
import {
  FinnhubSearchResponse,
  StockSearchResult,
} from './interfaces/search.interface';
import {
  PricePoint,
  PriceHistoryResponse,
} from './interfaces/price-history.interface';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/** Accepts clean US equity tickers: 1–5 uppercase letters, no dots or slashes */
const CLEAN_SYMBOL_RE = /^[A-Z]{1,5}$/;

/** Maximum price points stored per symbol (~6.5 h at 2-min polling) */
const MAX_HISTORY_POINTS = 200;

/** Quote polling interval for active symbols (2 minutes) */
const POLL_INTERVAL_MS = 2 * 60 * 1000;

/** Symbol universe TTL: refresh once per day */
const SYMBOLS_CACHE_TTL = 24 * 60 * 60 * 1000;

/** Displayed stock list TTL: new random selection every hour */
const STOCK_LIST_TTL = 60 * 60 * 1000;

/** Default count of stocks to surface on the list screen */
const DEFAULT_LIST_COUNT = 20;

/**
 * Emergency fallback used when the /stock/symbol API call fails on startup.
 * Provides enough variety for meaningful randomisation (30 large-cap names).
 */
const FALLBACK_SYMBOLS: Array<{ symbol: string; name: string }> = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'BAC', name: 'Bank of America Corp.' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'ACN', name: 'Accenture plc' },
  { symbol: 'NKE', name: 'NIKE Inc.' },
];

interface StockEntry {
  symbol: string;
  name: string;
}

interface CachedStockSelection {
  entries: StockEntry[];
  expiresAt: number;
}

@Injectable()
export class StocksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StocksService.name);

  // ── Symbol universe ────────────────────────────────────────────────────────
  private symbolUniverse: StockEntry[] = [];
  private symbolUniverseExpiresAt = 0;

  // ── Displayed stock list cache ─────────────────────────────────────────────
  private stockListCache: CachedStockSelection | null = null;

  // ── Price history (rolling buffer per symbol) ──────────────────────────────
  private readonly priceHistory = new Map<string, PricePoint[]>();

  // ── Active symbols polled for quote updates ────────────────────────────────
  private readonly activeSymbols = new Set<string>();
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService,
  ) {}

  private get apiKey(): string {
    return this.configService.getOrThrow<string>('FINNHUB_API_KEY');
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onModuleInit() {
    this.pollingTimer = setInterval(
      () => void this.pollActiveSymbols(),
      POLL_INTERVAL_MS,
    );
  }

  onModuleDestroy() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  // ── Symbol universe ────────────────────────────────────────────────────────

  /**
   * Loads (and caches) the full universe of US common stocks from Finnhub's
   * /stock/symbol endpoint. Filtered to standard equity tickers (1–5 letters).
   * Falls back to a built-in list if the API call fails.
   */
  private async loadSymbolUniverse(): Promise<StockEntry[]> {
    if (
      this.symbolUniverse.length &&
      Date.now() < this.symbolUniverseExpiresAt
    ) {
      return this.symbolUniverse;
    }

    try {
      const raw = await this.httpClient.get<FinnhubStockSymbol[]>(
        `${FINNHUB_BASE_URL}/stock/symbol`,
        { params: { exchange: 'US', token: this.apiKey } },
      );

      const filtered = raw
        .filter(
          (s) => s.type === 'Common Stock' && CLEAN_SYMBOL_RE.test(s.symbol),
        )
        .map((s) => ({ symbol: s.symbol, name: s.description }));

      if (filtered.length) {
        this.symbolUniverse = filtered;
        this.symbolUniverseExpiresAt = Date.now() + SYMBOLS_CACHE_TTL;
        this.logger.log(
          `Symbol universe loaded: ${filtered.length} common stocks`,
        );
        return filtered;
      }
    } catch (error) {
      this.logger.warn('Failed to load symbol universe, using fallback list');
    }

    // Use the built-in fallback so the app remains functional
    if (!this.symbolUniverse.length) {
      this.symbolUniverse = FALLBACK_SYMBOLS;
    }
    return this.symbolUniverse;
  }

  // ── Stock list ─────────────────────────────────────────────────────────────

  /**
   * Returns a randomly selected set of US common stocks enriched with live
   * quotes. The selection is re-randomised once per hour so the list feels
   * fresh without hammering the API on every request.
   */
  async getStockList(count = DEFAULT_LIST_COUNT): Promise<StockQuote[]> {
    try {
      if (!this.stockListCache || Date.now() >= this.stockListCache.expiresAt) {
        const universe = await this.loadSymbolUniverse();
        const shuffled = this.fisherYatesShuffle(universe);
        this.stockListCache = {
          entries: shuffled.slice(0, count),
          expiresAt: Date.now() + STOCK_LIST_TTL,
        };
      }

      const { entries } = this.stockListCache;

      // Update the active set so the polling loop captures these symbols
      this.activeSymbols.clear();
      entries.forEach(({ symbol }) => this.activeSymbols.add(symbol));

      // Fetch all quotes concurrently
      const quotes = await Promise.all(
        entries.map(({ symbol, name }) =>
          this.getQuote(symbol).then((q) => ({ ...q, name })),
        ),
      );

      // Seed price history with current price for any symbol with no history yet
      const now = Date.now();
      for (const q of quotes) {
        if (!this.priceHistory.has(q.symbol)) {
          this.addPricePoint(q.symbol, {
            timestamp: now,
            price: q.currentPrice,
          });
        }
      }

      return quotes;
    } catch (error) {
      return errorHandler('Failed to fetch stock list', this.logger, error);
    }
  }

  // ── Quote ──────────────────────────────────────────────────────────────────

  /**
   * Returns the current quote for a single symbol.
   *
   * @param symbol - Ticker symbol, e.g. 'AAPL'.
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const data = await this.httpClient.get<FinnhubQuote>(
        `${FINNHUB_BASE_URL}/quote`,
        { params: { symbol: symbol.toUpperCase(), token: this.apiKey } },
      );

      return {
        symbol: symbol.toUpperCase(),
        name: '',
        currentPrice: data.c,
        change: data.d,
        percentChange: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: data.t,
      };
    } catch (error) {
      return errorHandler(
        `Failed to fetch quote for ${symbol}`,
        this.logger,
        error,
      );
    }
  }

  // ── Price history ──────────────────────────────────────────────────────────

  /**
   * Records a real-time trade price received from the Finnhub WebSocket.
   * Called by StocksGateway on every incoming trade message.
   *
   * @param symbol    - Ticker symbol.
   * @param price     - Trade price.
   * @param timestamp - Trade timestamp in milliseconds.
   */
  recordTrade(symbol: string, price: number, timestamp: number): void {
    this.addPricePoint(symbol, { timestamp, price });
  }

  /**
   * Returns the accumulated price history for a symbol, suitable for rendering
   * a price-over-time line chart on the React Native side.
   * Points are ordered oldest → newest (up to MAX_HISTORY_POINTS entries).
   *
   * @param symbol - Ticker symbol, e.g. 'AAPL'.
   */
  getPriceHistory(symbol: string): PriceHistoryResponse {
    const s = symbol.toUpperCase();
    return {
      symbol: s,
      points: this.priceHistory.get(s) ?? [],
    };
  }

  private addPricePoint(symbol: string, point: PricePoint): void {
    const history = this.priceHistory.get(symbol) ?? [];
    history.push(point);
    if (history.length > MAX_HISTORY_POINTS) history.shift();
    this.priceHistory.set(symbol, history);
  }

  /**
   * Polls the current quote for every active symbol and stores the close price.
   * Runs on POLL_INTERVAL_MS. This is what powers the price-over-time chart
   * as a free alternative to the premium candle endpoint.
   */
  private async pollActiveSymbols(): Promise<void> {
    for (const symbol of this.activeSymbols) {
      try {
        const quote = await this.getQuote(symbol);
        this.addPricePoint(symbol, {
          timestamp: Date.now(),
          price: quote.currentPrice,
        });
      } catch {
        // Swallow individual failures; will retry on next interval
      }
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  /**
   * Searches Finnhub for stocks matching a query string.
   * Returns the top 10 matches.
   *
   * @param query - Search term (partial symbol or company name).
   */
  async searchSymbol(query: string): Promise<StockSearchResult[]> {
    try {
      const data = await this.httpClient.get<FinnhubSearchResponse>(
        `${FINNHUB_BASE_URL}/search`,
        { params: { q: query, token: this.apiKey } },
      );

      return data.result.slice(0, 10).map((item) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
      }));
    } catch (error) {
      return errorHandler(
        `Failed to search for symbol "${query}"`,
        this.logger,
        error,
      );
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  private fisherYatesShuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
