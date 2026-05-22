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

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

```bash
docker compose -f finnhub-app-backend/docker-compose.yml up -d
```

### 3. Configure environment

```bash
cp finnhub-app-backend/.env.example finnhub-app-backend/.env
# fill in JWT_SECRET, FINNHUB_API_KEY, and Firebase credentials
```

```bash
# finnhub-app-frontend/.env.local
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3000/api
```

### 4. Run both apps

```bash
# Backend (watch mode)
npm run backend

# Frontend (in a separate terminal)
npm run frontend
```

## Workspace Scripts

| Command | Description |
|---------|-------------|
| `npm run backend` | Start backend in watch mode |
| `npm run frontend` | Start Expo dev server |
| `npm run build` | Build backend for production |
| `npm run test` | Run backend unit tests |
| `npm run lint` | Lint all packages |
