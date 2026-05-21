export const envConfiguration = () => ({
  enviroment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3001,
  finnhubApiKey: process.env.FINNHUB_API_KEY,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
});
