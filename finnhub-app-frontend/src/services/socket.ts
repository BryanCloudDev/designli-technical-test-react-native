import { io, Socket } from 'socket.io-client';

// NestJS WebSocket gateways bypass the global prefix (e.g. /api).
// Extract just the origin (http://host:port) from the API URL.
function socketOrigin(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  const match = raw.match(/^(https?:\/\/[^/]+)/);
  return match ? match[1] : raw;
}
const BASE_URL = socketOrigin();

export type TradeEvent = {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
};

type TradeCallback = (event: TradeEvent) => void;

/**
 * Singleton Socket.io client for the /stocks namespace.
 *
 * Usage:
 *   stockSocket.connect(token);
 *   const unsub = stockSocket.subscribe('AAPL', (trade) => { ... });
 *   // later:
 *   unsub();
 *   stockSocket.disconnect();
 */
class StockSocketService {
  private socket: Socket | null = null;
  private readonly listeners = new Map<string, Set<TradeCallback>>();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(`${BASE_URL}/stocks`, {
      auth: { token },
      // Force WebSocket — avoids React Native long-polling issues
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2_000,
      reconnectionAttempts: 10,
    });

    this.socket.on('trade', (event: TradeEvent) => {
      this.listeners.get(event.symbol)?.forEach((cb) => cb(event));
    });

    this.socket.on('connect_error', (err: Error) => {
      console.warn('[StockSocket] connect_error:', err.message);
    });

    this.socket.on('reconnect', () => {
      // Re-subscribe all active symbols after a reconnect
      for (const symbol of this.listeners.keys()) {
        this.socket?.emit('subscribe', symbol);
      }
    });
  }

  /**
   * Subscribe to real-time trades for a symbol.
   * Returns an unsubscribe function — call it in your cleanup / useEffect return.
   */
  subscribe(symbol: string, callback: TradeCallback): () => void {
    const s = symbol.toUpperCase();

    if (!this.listeners.has(s)) {
      this.listeners.set(s, new Set());
      this.socket?.emit('subscribe', s);
    }
    this.listeners.get(s)!.add(callback);

    return () => {
      const cbs = this.listeners.get(s);
      if (!cbs) return;
      cbs.delete(callback);
      if (cbs.size === 0) {
        this.listeners.delete(s);
        this.socket?.emit('unsubscribe', s);
      }
    };
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const stockSocket = new StockSocketService();
