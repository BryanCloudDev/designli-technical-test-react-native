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
| GET | `/api/stocks/:symbol/price-history` | Yes | Price history (up to 200 points, ~6.5h) |
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

```bash
docker compose up
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
