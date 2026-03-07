import app from './app';
import { config } from './config';
import { checkDbConnection, closeDb } from './database';
import { runMigrations } from './database/migrations';
import { logLifecycle, logger } from './common/logger';

const PORT = config.server.port;

function bootstrap(): void {
  // 1. Verify DB is accessible (synchronous)
  try {
    checkDbConnection();
    logLifecycle('db_connected', { path: config.db.path });
  } catch (err) {
    logger.error('Failed to open SQLite database', { error: (err as Error).message });
    process.exit(1);
  }

  // 2. Run migrations (synchronous — idempotent CREATE IF NOT EXISTS)
  try {
    runMigrations();
  } catch (err) {
    logger.error('Migration failed', { error: (err as Error).message });
    process.exit(1);
  }

  // 3. Start HTTP server
  const server = app.listen(PORT, () => {
    logLifecycle('server_started', {
      port: PORT,
      environment: config.server.nodeEnv,
      pid: process.pid,
      db: config.db.path,
    });
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    logLifecycle('shutdown_initiated', { signal });

    server.close(() => {
      logLifecycle('http_server_closed');
      closeDb();
      logLifecycle('shutdown_complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', { reason: String(reason) });
  });
}

bootstrap();

// import app from './app';
// import { config } from './config';
// import { pool, checkDbConnection } from './database';
// import { runMigrations } from './database/migrations';
// import { logLifecycle, logger } from './common/logger';

// const PORT = config.server.port;

// async function bootstrap(): Promise<void> {
//   // 1. Verify DB connection
//   try {
//     await checkDbConnection();
//     logLifecycle('db_connected', { host: config.db.host, database: config.db.name });
//   } catch (err) {
//     logger.error('Failed to connect to database', { error: (err as Error).message });
//     process.exit(1);
//   }

//   // 2. Run migrations
//   try {
//     await runMigrations();
//   } catch (err) {
//     logger.error('Migration failed', { error: (err as Error).message });
//     process.exit(1);
//   }

//   // 3. Start HTTP server
//   const server = app.listen(PORT, () => {
//     logLifecycle('server_started', {
//       port: PORT,
//       environment: config.server.nodeEnv,
//       pid: process.pid,
//     });
//   });

//   // ── Graceful shutdown ─────────────────────────────────────────────────────
//   const shutdown = async (signal: string): Promise<void> => {
//     logLifecycle('shutdown_initiated', { signal });

//     server.close(async () => {
//       logLifecycle('http_server_closed');
//       try {
//         await pool.end();
//         logLifecycle('db_pool_closed');
//       } catch (err) {
//         logger.error('Error closing DB pool', { error: (err as Error).message });
//       }
//       logLifecycle('shutdown_complete');
//       process.exit(0);
//     });

//     setTimeout(() => {
//       logger.error('Forced shutdown after timeout');
//       process.exit(1);
//     }, 10_000);
//   };

//   process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
//   process.on('SIGINT',  () => { void shutdown('SIGINT'); });

//   process.on('uncaughtException', (err: Error) => {
//     logger.error('Uncaught exception', { error: err.message, stack: err.stack });
//     void shutdown('uncaughtException');
//   });

//   process.on('unhandledRejection', (reason: unknown) => {
//     logger.error('Unhandled promise rejection', { reason: String(reason) });
//   });
// }

// void bootstrap();