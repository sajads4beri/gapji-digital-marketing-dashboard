import * as Joi from 'joi';

export function validateEnv(config: Record<string, unknown>) {
  const schema = Joi.object({
    API_PORT: Joi.number().default(3001),
    API_PREFIX: Joi.string().default('api'),
    JWT_SECRET: Joi.string().default('change-me-in-production'),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('15m'),
    REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
    DATABASE_URL: Joi.string().optional(),
    DATABASE_HOST: Joi.string().default('localhost'),
    POSTGRES_PORT: Joi.number().default(5432),
    DATABASE_PORT: Joi.number().default(5432),
    POSTGRES_USER: Joi.string().default('gapji_user'),
    DATABASE_USERNAME: Joi.string().default('gapji_user'),
    POSTGRES_PASSWORD: Joi.string().default('gapji_password'),
    DATABASE_PASSWORD: Joi.string().default('gapji_password'),
    POSTGRES_DB: Joi.string().default('gapji_dashboard'),
    DATABASE_NAME: Joi.string().default('gapji_dashboard'),
    DATABASE_SYNCHRONIZE: Joi.string().default('false'),
    DATABASE_LOGGING: Joi.string().default('false'),
    DATABASE_MIGRATIONS_RUN: Joi.string().default('false'),
  });

  const { error, value } = schema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
}
