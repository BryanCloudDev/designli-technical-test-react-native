/**
 * Database seeder — runs automatically via docker compose before the API starts.
 * Safe to re-run: skips gracefully if the default user already exists.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { User } from '../../user/entities/user.entity';
import { PasswordResetToken } from '../../user/entities/password-reset-token.entity';
import { PriceAlert } from '../../price-alerts/entities/price-alert.entity';
import { WatchlistItem } from '../../watchlist/entities/watchlist-item.entity';
import { StockPriceHistory } from '../../stocks/entities/stock-price-history.entity';

// ── Configuration ─────────────────────────────────────────────────────────────

const DEFAULT_USER = {
  email: 'admin@finnhub.dev',
  password: 'Admin1234!',
  name: 'Admin',
  lastName: 'User',
};

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY ?? '';

const POPULAR_STOCKS: Array<{ symbol: string; name: string }> = [
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
];

const ALERT_COUNT = 5;
const WATCHLIST_COUNT = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pad(str: string, len: number): string {
  return str.padEnd(len);
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Backward random walk anchored to `currentPrice` at `now`.
 * The last generated point is always the real current market price.
 */
function generatePriceHistory(
  currentPrice: number,
  days = 91,
  intervalHours = 4,
): Array<{ timestamp: number; price: number }> {
  const now = Date.now();
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const totalPoints = Math.ceil((days * 24) / intervalHours);
  const volatility = 0.008; // ~0.8% per 4-hour step

  const prices: number[] = new Array(totalPoints);
  prices[totalPoints - 1] = currentPrice;

  for (let i = totalPoints - 2; i >= 0; i--) {
    const u = (Math.random() + Math.random() - 1) * volatility;
    prices[i] = Math.max(prices[i + 1] * (1 - u), 0.01);
  }

  return prices.map((price, idx) => ({
    timestamp: now - (totalPoints - 1 - idx) * intervalMs,
    price: Math.round(price * 10000) / 10000,
  }));
}

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const { data } = await axios.get<{ c: number }>(`${FINNHUB_BASE_URL}/quote`, {
      params: { symbol, token: API_KEY },
      timeout: 10_000,
    });
    return data.c > 0 ? data.c : null;
  } catch {
    return null;
  }
}

function printBanner(title: string) {
  const line = '─'.repeat(60);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${title.padEnd(58)}│`);
  console.log(`└${line}┘`);
}

function printSection(title: string) {
  console.log(`\n  ── ${title} ${'─'.repeat(Math.max(0, 54 - title.length))}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  printBanner('Finnhub App — Database Seeder');

  if (!API_KEY) {
    console.error('\n  ERROR: FINNHUB_API_KEY is not set in .env — aborting.\n');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, PasswordResetToken, PriceAlert, WatchlistItem, StockPriceHistory],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('\n  ✓ Connected to database');

  const userRepo = dataSource.getRepository(User);
  const alertRepo = dataSource.getRepository(PriceAlert);
  const watchlistRepo = dataSource.getRepository(WatchlistItem);
  const priceHistoryRepo = dataSource.getRepository(StockPriceHistory);

  // ── Guard: already seeded ──────────────────────────────────────────────────
  const existing = await userRepo.findOne({ where: { email: DEFAULT_USER.email } });
  if (existing) {
    printBanner('Already seeded — printing dev guide');
    await printDevGuide(alertRepo, watchlistRepo, existing.id);
    await dataSource.destroy();
    return;
  }

  // ── 1. Create default user ────────────────────────────────────────────────
  printSection('Creating default user');
  const hashedPassword = await bcrypt.hash(DEFAULT_USER.password, 10);
  const user = userRepo.create({
    email: DEFAULT_USER.email,
    password: hashedPassword,
    name: DEFAULT_USER.name,
    lastName: DEFAULT_USER.lastName,
  });
  await userRepo.save(user);
  console.log(`  ✓ ${DEFAULT_USER.name} ${DEFAULT_USER.lastName} created`);

  // ── 2. Fetch real prices from Finnhub ─────────────────────────────────────
  printSection('Fetching real-time prices from Finnhub');
  const stocksWithPrices: Array<{ symbol: string; name: string; price: number }> = [];

  for (const stock of POPULAR_STOCKS) {
    const price = await fetchCurrentPrice(stock.symbol);
    await delay(150);
    if (price !== null) {
      stocksWithPrices.push({ ...stock, price });
      console.log(`  ✓ ${pad(stock.symbol, 6)} ${formatPrice(price).padStart(10)}  ${stock.name}`);
    } else {
      console.warn(`  ✗ ${pad(stock.symbol, 6)} — no quote returned, skipping`);
    }
  }

  if (stocksWithPrices.length === 0) {
    console.error('\n  ERROR: No valid stock prices fetched — aborting.\n');
    await dataSource.destroy();
    process.exit(1);
  }

  // ── 3. Generate and insert 91 days of price history ───────────────────────
  printSection('Generating 91-day price history (4 h intervals per stock)');
  let totalPoints = 0;

  for (const stock of stocksWithPrices) {
    const points = generatePriceHistory(stock.price, 91, 4);
    totalPoints += points.length;

    const CHUNK = 500;
    for (let i = 0; i < points.length; i += CHUNK) {
      const chunk = points.slice(i, i + CHUNK).map((p) => ({
        symbol: stock.symbol,
        timestamp: p.timestamp,
        price: p.price,
      }));
      await priceHistoryRepo
        .createQueryBuilder()
        .insert()
        .into(StockPriceHistory)
        .values(chunk)
        .execute();
    }

    console.log(`  ✓ ${pad(stock.symbol, 6)} — ${points.length} price points inserted`);
  }

  // ── 4. Create price alerts ────────────────────────────────────────────────
  printSection(`Creating ${ALERT_COUNT} price alerts (+2% above current price)`);
  const alertStocks = stocksWithPrices.slice(0, ALERT_COUNT);
  const createdAlerts: Array<{ symbol: string; current: number; target: number }> = [];

  for (const stock of alertStocks) {
    const targetPrice = Math.round(stock.price * 1.02 * 100) / 100;
    await alertRepo.save(
      alertRepo.create({ userId: user.id, symbol: stock.symbol, targetPrice, isTriggered: false }),
    );
    createdAlerts.push({ symbol: stock.symbol, current: stock.price, target: targetPrice });
    console.log(
      `  ✓ ${pad(stock.symbol, 6)} alert @ ${formatPrice(targetPrice).padStart(10)}  (current ${formatPrice(stock.price)})`,
    );
  }

  // ── 5. Create watchlist ───────────────────────────────────────────────────
  printSection(`Creating ${WATCHLIST_COUNT} watchlist items`);
  const watchlistStocks = stocksWithPrices.slice(0, WATCHLIST_COUNT);

  for (const stock of watchlistStocks) {
    await watchlistRepo.save(watchlistRepo.create({ userId: user.id, symbol: stock.symbol }));
    console.log(`  ✓ ${pad(stock.symbol, 6)} added to watchlist`);
  }

  await dataSource.destroy();

  // ── Summary / dev guide ───────────────────────────────────────────────────
  printDevSummary(stocksWithPrices, createdAlerts, watchlistStocks, totalPoints);
}

// ── Dev-guide printers ────────────────────────────────────────────────────────

function printDevSummary(
  stocks: Array<{ symbol: string; name: string; price: number }>,
  alerts: Array<{ symbol: string; current: number; target: number }>,
  watchlist: Array<{ symbol: string; name: string; price: number }>,
  totalHistoryPoints: number,
) {
  const line = '═'.repeat(60);
  console.log(`\n\n╔${line}╗`);
  console.log(`║${'  SEED COMPLETE — DEVELOPER GUIDE'.padEnd(60)}║`);
  console.log(`╚${line}╝`);

  // Login
  console.log('\n  LOGIN CREDENTIALS');
  console.log('  ─────────────────────────────────────');
  console.log(`  Email    : ${DEFAULT_USER.email}`);
  console.log(`  Password : ${DEFAULT_USER.password}`);

  // Chart data
  console.log('\n  PRICE HISTORY');
  console.log('  ─────────────────────────────────────');
  console.log(`  Each of the ${stocks.length} stocks below has ${Math.round(totalHistoryPoints / stocks.length)}`);
  console.log(`  data points covering the last 91 days (sampled every`);
  console.log(`  4 hours). All chart period tabs — 1D 5D 1M 6M — will`);
  console.log(`  be enabled immediately after login.`);

  // Stock table
  console.log('\n  SEEDED STOCKS (open any of these to see the full chart)');
  console.log('  ──────────────────────────────────────────────────────');
  console.log(`  ${'SYMBOL'.padEnd(8)} ${'CURRENT PRICE'.padStart(14)}  NAME`);
  console.log(`  ${'──────'.padEnd(8)} ${'─────────────'.padStart(14)}  ────────────────────────────`);
  for (const s of stocks) {
    const inWatchlist = watchlist.some((w) => w.symbol === s.symbol);
    const hasAlert = alerts.some((a) => a.symbol === s.symbol);
    const tags = [inWatchlist ? 'watchlist' : '', hasAlert ? 'alert' : '']
      .filter(Boolean)
      .join(', ');
    console.log(`  ${pad(s.symbol, 8)} ${formatPrice(s.price).padStart(14)}  ${s.name}${tags ? `  [${tags}]` : ''}`);
  }

  // Price alerts
  console.log('\n  PRICE ALERTS (will fire when stock hits target)');
  console.log('  ─────────────────────────────────────────────────');
  console.log(`  ${'SYMBOL'.padEnd(8)} ${'CURRENT'.padStart(10)}  ${'TARGET (+2%)'.padStart(12)}  DELTA`);
  console.log(`  ${'──────'.padEnd(8)} ${'───────'.padStart(10)}  ${'───────────'.padStart(12)}  ─────`);
  for (const a of alerts) {
    const delta = ((a.target - a.current) / a.current * 100).toFixed(2);
    console.log(
      `  ${pad(a.symbol, 8)} ${formatPrice(a.current).padStart(10)}  ${formatPrice(a.target).padStart(12)}  +${delta}%`,
    );
  }

  // Watchlist
  console.log('\n  WATCHLIST');
  console.log('  ─────────────────────────────────────────────────');
  console.log(`  ${watchlist.map((w) => w.symbol).join('  ')}`);

  // Tips
  console.log('\n  HOW TO TEST');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  1. Log in with the credentials above');
  console.log('  2. Open any stock from the list (e.g. AAPL, NVDA, TSLA)');
  console.log('  3. The chart should show data — tap 1D / 5D / 1M / 6M');
  console.log('     to switch periods (all tabs enabled right away)');
  console.log('  4. Watchlist tab shows the first 10 stocks pre-added');
  console.log('  5. Alerts tab shows 5 alerts set just above market price');
  console.log('     — trigger one by pushing the stock price past its');
  console.log('     threshold via the Finnhub WebSocket or polling');
  console.log(`\n  API base URL: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(`  Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api\n`);
}

async function printDevGuide(
  alertRepo: ReturnType<DataSource['getRepository']>,
  watchlistRepo: ReturnType<DataSource['getRepository']>,
  userId: string,
) {
  const alerts = await alertRepo.find({ where: { userId } });
  const watchlist = await watchlistRepo.find({ where: { userId } });

  const line = '═'.repeat(60);
  console.log(`\n\n╔${line}╗`);
  console.log(`║${'  ALREADY SEEDED — DEVELOPER GUIDE'.padEnd(60)}║`);
  console.log(`╚${line}╝`);

  console.log('\n  LOGIN CREDENTIALS');
  console.log('  ─────────────────────────────────────');
  console.log(`  Email    : ${DEFAULT_USER.email}`);
  console.log(`  Password : ${DEFAULT_USER.password}`);

  console.log('\n  PRICE ALERTS IN DB');
  console.log('  ─────────────────────────────────────');
  if (alerts.length === 0) {
    console.log('  (none)');
  } else {
    for (const a of alerts) {
      const status = a.isTriggered ? '✓ triggered' : 'pending';
      console.log(`  ${pad(a.symbol, 6)} target ${formatPrice(Number(a.targetPrice))}  [${status}]`);
    }
  }

  console.log('\n  WATCHLIST IN DB');
  console.log('  ─────────────────────────────────────');
  if (watchlist.length === 0) {
    console.log('  (none)');
  } else {
    console.log(`  ${watchlist.map((w) => w.symbol).join('  ')}`);
  }

  console.log('\n  HOW TO TEST');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  1. Log in with the credentials above');
  console.log('  2. Open any stock (e.g. AAPL, NVDA, TSLA) to see');
  console.log('     the chart with 91 days of seeded history');
  console.log('  3. All period tabs (1D 5D 1M 6M) should be active');
  console.log(`\n  API base URL: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(`  Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api\n`);
}

seed().catch((err) => {
  console.error('\n  Seed failed:', err, '\n');
  process.exit(1);
});
