import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth.context';
import { stockSocket, TradeEvent } from '@/services/socket';

/**
 * Subscribes to real-time trades for `symbol` via the /stocks Socket.io gateway.
 * Automatically connects the socket (if not already), subscribes on mount,
 * and unsubscribes on unmount.
 *
 * Returns the latest TradeEvent, or null before the first trade arrives.
 */
export function useTrade(symbol: string | null | undefined): TradeEvent | null {
  const { token } = useAuth();
  const [trade, setTrade] = useState<TradeEvent | null>(null);

  useEffect(() => {
    if (!token || !symbol) return;
    stockSocket.connect(token);
    return stockSocket.subscribe(symbol.toUpperCase(), setTrade);
  }, [token, symbol]);

  return trade;
}
