import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().default('autopilot-client'),
  KAFKA_GROUP_ID: Joi.string().default('autopilot-group'),
  AUTH_KAFKA_API_URL: Joi.string().required(),
  AUTH_KAFKA_CLIENT_ID: Joi.string().required(),
  AUTH_KAFKA_CLIENT_SECRET: Joi.string().required(),
  AUTH_TOPCODER_API_URL: Joi.string().required(),
  AUTH_TOPCODER_CLIENT_ID: Joi.string().required(),
  AUTH_TOPCODER_CLIENT_SECRET: Joi.string().required(),
}).unknown(true);