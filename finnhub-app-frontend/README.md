# Finnhub App Frontend

A React Native (Expo) mobile app for browsing real-time stock data, managing a watchlist, and setting price alerts with push notifications.

## Features

- **Authentication** — Login, register, forgot/reset password with JWT token storage
- **Markets** — Browse popular stocks, search by symbol, view live prices
- **Stock Detail** — Real-time price chart with WebSocket trade updates
- **Watchlist** — Add/remove stocks; persisted per user
- **Price Alerts** — Set target price thresholds; triggered alerts deliver FCM push notifications
- **Dark / Light Theme** — Toggle manually or follow system preference; persisted across sessions

## Screens

| Route | Description |
|-------|-------------|
| `/login` | Email/password login |
| `/register` | Account creation |
| `/forgot-password` | Request password reset |
| `/reset-password` | Complete password reset via token |
| `/(app)` | Markets tab — stock list & search |
| `/(app)/explore` | Account tab — profile & settings |
| `/stock/[symbol]` | Stock detail with price chart |
| `/price-alerts` | Create and manage price alerts |
| `/watchlists` | View and manage watchlist |

## Tech Stack

- **Framework** — Expo ~55, React Native 0.83, React 19
- **Routing** — Expo Router (file-based)
- **State** — React Context (`AuthContext`, `ThemeContext`)
- **Real-time** — Socket.io client (`/stocks` namespace)
- **Notifications** — Firebase Cloud Messaging via `expo-notifications`
- **Storage** — `expo-secure-store` (native) / `localStorage` (web)
- **Charts** — `react-native-svg` + `react-native-reanimated`

## Project Setup

```bash
npm install
```

Create a `.env.local` file:

```env
EXPO_PUBLIC_API_URL=http://<your-local-ip>:3000/api
```

> Use your machine's local IP (not `localhost`) when running on a physical device or Android emulator.

## Running the App

```bash
# Start Expo dev server
npx expo start
```

Then open in:
- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`
- **Physical device** — scan the QR code with Expo Go

## Push Notifications (FCM)

A `google-services.json` file (Android) is required for FCM. Place it in the project root. The app requests notification permissions on startup and registers the device token with the backend.

## Key Architecture Notes

- Navigation is guarded by `AuthContext`; unauthenticated users are redirected to `/login`
- `useTrade(symbol)` hook manages WebSocket subscriptions with auto-connect/disconnect
- Themed components (`ThemedView`, `ThemedText`) pull colors from `ThemeContext`
- Platform splits for web vs. native: `*.web.ts` files override their native counterparts
