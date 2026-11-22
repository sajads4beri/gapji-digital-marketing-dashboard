export const configuration = () => ({
  port: parseInt(process.env.API_PORT || '3001', 10),
  prefix: process.env.API_PREFIX || 'api',
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || process.env.DATABASE_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || process.env.DATABASE_USERNAME || 'gapji_user',
    password: process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD || 'gapji_password',
    database: process.env.POSTGRES_DB || process.env.DATABASE_NAME || 'gapji_dashboard',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'true',
  },
});
