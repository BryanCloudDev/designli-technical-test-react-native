# Finnhub App Backend

A NestJS REST API that powers the Finnhub mobile app — providing real-time stock data, price alerts, and watchlist management.

## Features

- **Authentication** — JWT-based login/register/password-reset with 12-hour token expiration
- **Stocks** — Quote lookup, symbol search, price history, and real-time trades via Finnhub WebSocket
- **Watchlist** — Add, list, and remove stocks from a personal watchlist
- **Price Alerts** — Create threshold-based alerts that trigger FCM push notifications
- **Push Notifications** — Firebase Cloud Messaging (FCM) integration for price alert delivery
- **Swagger UI** — Auto-generated API docs at `/api`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/user/register` | No | Create account, returns JWT |
| POST | `/api/user/login` | No | Authenticate, returns JWT |
| POST | `/api/user/forgot-password` | No | Initiate password reset |
| POST | `/api/user/reset-password` | No | Complete password reset |
| PATCH | `/api/user/fcm-token` | Yes | Register device FCM token |
| GET | `/api/stocks` | Yes | 20 popular stocks with live quotes |
| GET | `/api/stocks/search?q=` | Yes | Search stocks (top 10 results) |
| GET | `/api/stocks/:symbol/quote` | Yes | Current quote for a symbol |
| GET | `/api/stocks/:symbol/price-history` | Yes | Price history (seeded 91-day DB data + live in-memory points) |
| POST | `/api/watchlist` | Yes | Add stock to watchlist |
| GET | `/api/watchlist` | Yes | List watchlist items |
| DELETE | `/api/watchlist/:id` | Yes | Remove from watchlist |
| POST | `/api/price-alerts` | Yes | Create price alert |
| GET | `/api/price-alerts` | Yes | List price alerts |
| DELETE | `/api/price-alerts/:id` | Yes | Delete price alert |

### WebSocket (`/stocks` namespace)

| Event | Direction | Description |
|-------|-----------|-------------|
| `subscribe` | Client → Server | Subscribe to live trades for a symbol |
| `unsubscribe` | Client → Server | Stop receiving trades for a symbol |
| `trade` | Server → Client | Real-time trade event (symbol, price, timestamp, volume) |

## Tech Stack

- **Framework** — NestJS 11, TypeScript
- **Database** — MySQL via TypeORM
- **Auth** — Passport.js + JWT
- **Real-time** — Socket.io + Finnhub WebSocket (`wss://ws.finnhub.io`)
- **Notifications** — Firebase Admin SDK (FCM)
- **Rate limiting** — 100 requests / 15 min per IP (global)
- **Docs** — Swagger / OpenAPI

## Project Setup

```bash
npm install
```

Copy and fill in the environment file:

```bash
cp .env.example .env
```

### Environment Variables

```env
PORT=3000
JWT_SECRET=

DATABASE_HOST=
DATABASE_PORT=3306
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=

FINNHUB_API_KEY=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Running the App

```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Running with Docker

Docker Compose handles the full stack: MySQL, the database seeder, and the API — in the correct order.

### First run

```bash
# Build images and start everything
docker compose up --build
```

**Startup order:**

1. **`mysql`** — starts and waits until the health check passes
2. **`seeder`** — connects to MySQL, seeds the database, and exits
3. **`api`** — starts only after the seeder exits successfully

On the first run the seeder creates:
- A default user with pre-filled watchlist and price alerts
- 91 days of synthetic price history for 20 popular stocks (fetched from Finnhub at real current prices)

On every subsequent run the seeder detects existing data, skips the insert, and prints the dev guide — so credentials are always visible in the logs.

### Viewing seeder output

```bash
# Follow seeder logs during startup
docker compose logs -f seeder
```

Sample output:

```
  LOGIN CREDENTIALS
  -------------------------------------
  Email    : admin@finnhub.dev
  Password : Admin1234!

  SEEDED STOCKS (open any of these to see the full chart)
  SYMBOL    CURRENT PRICE  NAME
  AAPL          $198.45  Apple Inc.   [watchlist, alert]
  MSFT          $415.22  Microsoft Corporation  [watchlist, alert]
  ...

  HOW TO TEST
  1. Log in with the credentials above
  2. Open any stock (e.g. AAPL, NVDA, TSLA) to see the chart
  3. All period tabs (1D 5D 1M 6M) should be active
```

### Subsequent runs (no rebuild needed)

```bash
docker compose up
```

### Running in detached mode

```bash
docker compose up -d

# Check that all services came up
docker compose ps

# Follow the API logs
docker compose logs -f api
```

### Re-seeding from scratch

To wipe all data and re-seed with fresh prices:

```bash
# Stop containers and remove the database volume
docker compose down -v

# Bring everything back up — seeder will run fresh
docker compose up --build
```

### Stopping

```bash
docker compose down
```

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```
