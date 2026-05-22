const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type ApiError = { message: string | string[]; statusCode: number };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: 'Request failed',
      statusCode: response.status,
    }));
    const message = Array.isArray(error.message) ? error.message[0] : error.message;
    throw new Error(message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  lastName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = {
  register: (data: RegisterPayload) =>
    request<{ token: string }>('/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginPayload) =>
    request<{ token: string }>('/user/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken: string }>('/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ message: string }>('/user/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  registerFcmToken: (deviceToken: string, authToken: string) =>
    request<{ message: string }>('/user/fcm-token', {
      method: 'PATCH',
      body: JSON.stringify({ token: deviceToken }),
      headers: { Authorization: `Bearer ${authToken}` },
    }),
};

// ── Stocks ────────────────────────────────────────────────────────────────────

export type StockQuote = {
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
};

export type StockSearchResult = {
  symbol: string;
  name: string;
  type: string;
};

export type PricePoint = {
  timestamp: number;
  price: number;
};

export type PriceHistoryResponse = {
  symbol: string;
  points: PricePoint[];
};

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── Price Alerts ───────────────────────────────────────────────────────────────

export type PriceAlert = {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  isTriggered: boolean;
  createdAt: string;
};

export const priceAlertsApi = {
  create: (data: { symbol: string; targetPrice: number }, token: string) =>
    request<PriceAlert>('/price-alerts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeader(token),
    }),

  findAll: (token: string) =>
    request<PriceAlert[]>('/price-alerts', { headers: authHeader(token) }),

  remove: (id: string, token: string) =>
    request<{ message: string }>(`/price-alerts/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    }),
};

// ── Watchlist ─────────────────────────────────────────────────────────────────

export type WatchlistItem = {
  id: string;
  userId: string;
  symbol: string;
  createdAt: string;
};

export const watchlistApi = {
  add: (symbol: string, token: string) =>
    request<WatchlistItem>('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
      headers: authHeader(token),
    }),

  findAll: (token: string) =>
    request<WatchlistItem[]>('/watchlist', { headers: authHeader(token) }),

  remove: (id: string, token: string) =>
    request<{ message: string }>(`/watchlist/${id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    }),
};

// ── Stocks ────────────────────────────────────────────────────────────────────

export const stocksApi = {
  getStockList: (token: string) =>
    request<StockQuote[]>('/stocks', { headers: authHeader(token) }),

  searchSymbol: (q: string, token: string) =>
    request<StockSearchResult[]>(`/stocks/search?q=${encodeURIComponent(q)}`, {
      headers: authHeader(token),
    }),

  getQuote: (symbol: string, token: string) =>
    request<StockQuote>(`/stocks/${encodeURIComponent(symbol)}/quote`, {
      headers: authHeader(token),
    }),

  getPriceHistory: (symbol: string, token: string) =>
    request<PriceHistoryResponse>(
      `/stocks/${encodeURIComponent(symbol)}/price-history`,
      { headers: authHeader(token) },
    ),
};
