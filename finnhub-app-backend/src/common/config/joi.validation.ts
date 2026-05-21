import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(3306),
  DATABASE_USERNAME: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  PORT: Joi.number().default(3000),
  FINNHUB_API_KEY: Joi.string().required(),
});
