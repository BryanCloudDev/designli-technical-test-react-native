# Finnhub App

A full-stack stock market app built as a technical test for Designli. It provides real-time stock quotes, a personal watchlist, and price alerts with push notifications.

## Monorepo Structure

```
finnhub-app/
├── finnhub-app-backend/   # NestJS REST API + WebSocket server
└── finnhub-app-frontend/  # React Native (Expo) mobile app
```

See each package's README for full details:
- [`finnhub-app-backend/README.md`](./finnhub-app-backend/README.md)
- [`finnhub-app-frontend/README.md`](./finnhub-app-frontend/README.md)

## Prerequisites

- Node.js 20+
- MySQL 8 (or Docker)
- Expo CLI (`npm install -g expo-cli`)
- A [Finnhub](https://finnhub.io) API key
- A Firebase project with FCM enabled

## Quick Start

### 1. Configure environment

```bash
cp finnhub-app-backend/.env.example finnhub-app-backend/.env
# fill in JWT_SECRET, FINNHUB_API_KEY, and Firebase credentials
```

```bash
# finnhub-app-frontend — create .env.local
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3000/api
```

### 2. Start the backend with Docker

```bash
cd finnhub-app-backend
docker compose up --build
```

This starts three services in order:

| Service | Role |
|---------|------|
| `mysql` | Database — waits until healthy |
| `seeder` | Seeds DB with a default user, 20 stocks (91 days of price history), 5 price alerts, and a 10-item watchlist, then exits |
| `api` | NestJS REST + WebSocket server — starts after seeder completes |

The seeder prints login credentials and a full test guide every time it runs. View them with:

```bash
docker compose logs seeder
```

**Default credentials (created by the seeder):**

```
Email    : admin@finnhub.dev
Password : Admin1234!
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Start the frontend

```bash
npm run frontend
```

---

## Local Development (without Docker)

```bash
# Install all workspace dependencies
npm install

# Start a MySQL instance separately, then:
npm run backend    # NestJS in watch mode
npm run frontend   # Expo dev server (separate terminal)

# Seed the local database
npm run seed       # run from finnhub-app-backend/
```

## Workspace Scripts

| Command | Description |
|---------|-------------|
| `npm run backend` | Start backend in watch mode |
| `npm run frontend` | Start Expo dev server |
| `npm run build` | Build backend for production |
| `npm run test` | Run backend unit tests |
| `npm run lint` | Lint all packages |

Run from `finnhub-app-backend/`:

| Command | Description |
|---------|-------------|
| `npm run seed` | Seed database with default user and stock data |
