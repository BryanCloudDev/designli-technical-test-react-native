import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  DB_HOSTNAME: Joi.string().default('localhost'),
  DB_NAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  PORT: Joi.number().default(3000),
});
