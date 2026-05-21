/** A single price sample for time-series charting */
export interface PricePoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Stock price at this moment */
  price: number;
}

/** Price history response returned to React Native for charting */
export interface PriceHistoryResponse {
  symbol: string;
  /** Chronologically ordered price points (oldest → newest) */
  points: PricePoint[];
}
