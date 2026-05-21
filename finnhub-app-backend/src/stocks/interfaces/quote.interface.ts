/** Single entry from Finnhub GET /stock/symbol */
export interface FinnhubStockSymbol {
  symbol: string;
  displaySymbol: string;
  /** Company name / description */
  description: string;
  /** Security type, e.g. 'Common Stock', 'ETF' */
  type: string;
  currency: string;
  /** Primary exchange MIC code */
  mic: string;
}

/** Raw quote response from Finnhub GET /quote */
export interface FinnhubQuote {
  /** Current price */
  c: number;
  /** Change (current - previous close) */
  d: number;
  /** Percent change */
  dp: number;
  /** High price of the day */
  h: number;
  /** Low price of the day */
  l: number;
  /** Open price of the day */
  o: number;
  /** Previous close price */
  pc: number;
  /** Unix timestamp of the quote */
  t: number;
}

/** Normalized stock quote returned to the React Native client */
export interface StockQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}
