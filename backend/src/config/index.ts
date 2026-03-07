import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  server: {
    port: parseInt(optional('PORT', '8000'), 10),
    nodeEnv: optional('NODE_ENV', 'development'),
    isProduction: optional('NODE_ENV', 'development') === 'production',
  },
//   db: {
//     host:                optional('DB_HOST', 'localhost'),
//     port:                parseInt(optional('DB_PORT', '5432'), 10),
//     name:                optional('DB_NAME', 'hrms_db'),
//     user:                optional('DB_USER', 'postgres'),
//     password:            optional('DB_PASSWORD', 'postgres'),
//     poolMax:             parseInt(optional('DB_POOL_MAX', '10'), 10),
//     idleTimeoutMs:       parseInt(optional('DB_POOL_IDLE_TIMEOUT_MS', '30000'), 10),
//     connectionTimeoutMs: parseInt(optional('DB_POOL_CONNECTION_TIMEOUT_MS', '2000'), 10),
//   },

  db: {
    // Path to the SQLite .db file; default is <project-root>/data/hrms.db
    path: path.resolve(
      process.cwd(),
      optional('SQLITE_DB_PATH', 'data/hrms.db')
    ),
  },
  jwt: {
    secret:    optional('JWT_SECRET', 'dev-secret-change-in-production-min-32-chars!!'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },
  cors: {
    origins: optional(
      'CORS_ORIGINS',
      'http://localhost:5172,https://hrms-lemon-one.vercel.app'
    )
      .split(',')
      .map((o) => o.trim()),
  },
  logging: {
    level: optional('LOG_LEVEL', 'info'),
    dir:   optional('LOG_DIR', 'logs'),
  },
} as const;