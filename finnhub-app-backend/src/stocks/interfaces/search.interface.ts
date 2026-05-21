/** Single result from Finnhub GET /search */
export interface FinnhubSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

/** Raw Finnhub search response */
export interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
}

/** Normalized search result returned to the React Native client */
export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
}
