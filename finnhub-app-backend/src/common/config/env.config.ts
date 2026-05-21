export const envConfiguration = () => ({
  enviroment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3001,
  finnhubApiKey: process.env.FINNHUB_API_KEY,
});
