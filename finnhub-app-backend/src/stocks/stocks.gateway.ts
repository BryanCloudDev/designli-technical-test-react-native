import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';

import { StocksService } from './stocks.service';

interface FinnhubTrade {
  /** Price */
  p: number;
  /** Symbol */
  s: string;
  /** Timestamp in milliseconds */
  t: number;
  /** Volume */
  v: number;
}

interface FinnhubWsMessage {
  type: 'trade' | 'ping' | 'error';
  data?: FinnhubTrade[];
}

/** Real-time trade event emitted to React Native clients */
export interface TradeEvent {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
}

/**
 * Socket.io gateway that bridges Finnhub's WebSocket to React Native clients.
 *
 * - Clients connect to the `/stocks` namespace.
 * - Send `{ event: 'subscribe', data: 'AAPL' }` to subscribe to live trades.
 * - Send `{ event: 'unsubscribe', data: 'AAPL' }` to stop receiving updates.
 * - Server emits `{ event: 'trade', data: TradeEvent }` for every incoming trade.
 *
 * The gateway maintains a single upstream Finnhub WebSocket connection and
 * automatically reconnects on failure. Finnhub subscriptions are tracked per
 * symbol and torn down when the last interested client disconnects.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/stocks' })
export class StocksGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StocksGateway.name);

  /** Active upstream Finnhub WebSocket connection */
  private finnhubWs: WebSocket | null = null;

  /** Symbols currently subscribed on the Finnhub side */
  private readonly subscribedSymbols = new Set<string>();

  /** Maps each symbol to the set of Socket.io client IDs watching it */
  private readonly symbolClients = new Map<string, Set<string>>();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly stocksService: StocksService,
  ) {}

  onModuleInit() {
    this.connectToFinnhub();
  }

  onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.finnhubWs?.close();
  }

  // ---------------------------------------------------------------------------
  // Finnhub upstream connection
  // ---------------------------------------------------------------------------

  private connectToFinnhub() {
    const apiKey = this.configService.getOrThrow<string>('FINNHUB_API_KEY');
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    this.finnhubWs = ws;

    ws.on('open', () => {
      this.logger.log('Connected to Finnhub WebSocket');
      // Restore subscriptions after a reconnect
      for (const symbol of this.subscribedSymbols) {
        this.sendToFinnhub('subscribe', symbol);
      }
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const message: FinnhubWsMessage = JSON.parse(raw.toString());
        if (message.type === 'trade' && message.data) {
          for (const trade of message.data) {
            // Store price point for the history chart
            this.stocksService.recordTrade(trade.s, trade.p, trade.t);

            const event: TradeEvent = {
              symbol: trade.s,
              price: trade.p,
              timestamp: trade.t,
              volume: trade.v,
            };
            // Emit only to clients in the symbol's room
            this.server.to(trade.s).emit('trade', event);
          }
        }
      } catch (err) {
        this.logger.error('Failed to parse Finnhub message', err);
      }
    });

    ws.on('close', () => {
      this.logger.warn('Finnhub WebSocket closed — reconnecting in 5 s');
      this.reconnectTimer = setTimeout(() => this.connectToFinnhub(), 5_000);
    });

    ws.on('error', (err: Error) => {
      this.logger.error(`Finnhub WebSocket error: ${err.message}`);
    });
  }

  private sendToFinnhub(type: 'subscribe' | 'unsubscribe', symbol: string) {
    if (this.finnhubWs?.readyState === WebSocket.OPEN) {
      this.finnhubWs.send(JSON.stringify({ type, symbol }));
    }
  }

  // ---------------------------------------------------------------------------
  // Client lifecycle
  // ---------------------------------------------------------------------------

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.removeClientFromAllSymbols(client.id);
  }

  private removeClientFromAllSymbols(clientId: string) {
    for (const [symbol, clients] of this.symbolClients.entries()) {
      if (!clients.has(clientId)) continue;
      clients.delete(clientId);
      if (clients.size === 0) {
        this.symbolClients.delete(symbol);
        this.subscribedSymbols.delete(symbol);
        this.sendToFinnhub('unsubscribe', symbol);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Client events
  // ---------------------------------------------------------------------------

  /**
   * Subscribe a client to real-time trades for `symbol`.
   *
   * Emits back `{ event: 'subscribed', data: 'AAPL' }`.
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() symbol: string,
    @ConnectedSocket() client: Socket,
  ) {
    const s = symbol.toUpperCase();
    client.join(s);

    if (!this.symbolClients.has(s)) {
      this.symbolClients.set(s, new Set());
    }
    this.symbolClients.get(s)!.add(client.id);

    if (!this.subscribedSymbols.has(s)) {
      this.subscribedSymbols.add(s);
      this.sendToFinnhub('subscribe', s);
    }

    return { event: 'subscribed', data: s };
  }

  /**
   * Unsubscribe a client from real-time trades for `symbol`.
   *
   * Emits back `{ event: 'unsubscribed', data: 'AAPL' }`.
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() symbol: string,
    @ConnectedSocket() client: Socket,
  ) {
    const s = symbol.toUpperCase();
    client.leave(s);

    const clients = this.symbolClients.get(s);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.symbolClients.delete(s);
        this.subscribedSymbols.delete(s);
        this.sendToFinnhub('unsubscribe', s);
      }
    }

    return { event: 'unsubscribed', data: s };
  }
}
