// import Database from 'better-sqlite3';
import DatabaseConstructor, { Database } from "better-sqlite3";
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import logger, { logDbQuery } from '../common/logger';
import { runMigrations } from './migrations';

let initialized = false;

// ── Ensure the data directory exists before opening the file ─────────────────
const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ── Open (or create) the SQLite database file ─────────────────────────────────
// export const db: Database = new Database(config.db.path, {
export const db: Database = new DatabaseConstructor(config.db.path, {
  verbose: (message: unknown) => {
    logger.debug('sqlite_statement', { sql: String(message).trim().slice(0, 200) });
  },
});

// WAL mode — much better write performance
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

logger.info('SQLite database opened', { path: config.db.path });

/* -------------------------------------------------------------------------- */
/* DATABASE INITIALIZATION (for local + serverless)                           */
/* -------------------------------------------------------------------------- */

export function initializeDatabase(): void {
  if (initialized) return;

  try {
    db.prepare('SELECT 1').get();

    logger.info('SQLite connection verified');

    runMigrations();

    logger.info('Database migrations ensured');

    initialized = true;
  } catch (err) {
    logger.error('Database initialization failed', {
      error: (err as Error).message,
    });
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* QUERY HELPERS                                                              */
/* -------------------------------------------------------------------------- */

export function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] | Record<string, unknown> = []
): T[] {

  const start = Date.now();
  const words = sql.trim().split(/\s+/);
  const operation = (words[0] ?? 'QUERY').toUpperCase();
  const table = (words[1] ?? 'unknown').replace(/[^a-zA-Z_]/g, '');

  try {

    const stmt = db.prepare(sql);
    let rows: T[];

    if (operation === 'SELECT' || sql.trim().toUpperCase().startsWith('WITH')) {
      rows = stmt.all(params) as T[];
    } else {

      if (sql.toUpperCase().includes('RETURNING')) {
        rows = stmt.all(params) as T[];
      } else {
        stmt.run(params);
        rows = [];
      }

    }

    logDbQuery({
      operation,
      table,
      durationMs: Date.now() - start,
      rowCount: rows.length,
    });

    return rows;

  } catch (err) {

    const error = err as Error;

    logDbQuery({
      operation,
      table,
      durationMs: Date.now() - start,
      error: error.message,
    });

    throw err;
  }
}

export function run(
  sql: string,
  params: unknown[] | Record<string, unknown> = []
// ): Database.RunResult {
): import("better-sqlite3").RunResult {

  const start = Date.now();
  const words = sql.trim().split(/\s+/);
  const operation = (words[0] ?? 'RUN').toUpperCase();
  const table = (words[1] ?? 'unknown').replace(/[^a-zA-Z_]/g, '');

  try {

    const result = db.prepare(sql).run(params);

    logDbQuery({
      operation,
      table,
      durationMs: Date.now() - start,
      rowCount: result.changes,
    });

    return result;

  } catch (err) {

    const error = err as Error;

    logDbQuery({
      operation,
      table,
      durationMs: Date.now() - start,
      error: error.message,
    });

    throw err;
  }
}

export function withTransaction<T>(fn: () => T): T {
  const txn = db.transaction(fn);
  return txn();
}

export function checkDbConnection(): void {
  db.prepare('SELECT 1').get();
}

export function closeDb(): void {
  db.close();
  logger.info('SQLite database closed');
}


// import { Pool, PoolClient, QueryResult } from 'pg';
// import { config } from '../config/index';
// import logger, { logDbQuery } from '../common/logger';

// // ── Connection pool ───────────────────────────────────────────────────────────
// export const pool = new Pool({
//   host: config.db.host,
//   port: config.db.port,
//   database: config.db.name,
//   user: config.db.user,
//   password: config.db.password,
//   max: config.db.poolMax,
//   idleTimeoutMillis: config.db.idleTimeoutMs,
//   connectionTimeoutMillis: config.db.connectionTimeoutMs,
// });

// pool.on('connect', () => {
//   logger.debug('New DB client connected to pool');
// });

// pool.on('error', (err: Error) => {
//   logger.error('Unexpected DB pool error', { error: err.message, stack: err.stack });
// });

// // ── Generic timed query helper ────────────────────────────────────────────────
// export async function query<T = Record<string, unknown>>(
//   text: string,
//   params?: unknown[]
// ): Promise<QueryResult<T>> {
//   const start = Date.now();
//   // Derive table name + operation from first two words of query
//   const words = text.trim().split(/\s+/);
//   const operation = words[0]?.toUpperCase() ?? 'QUERY';
//   const table = words[1]?.replace(/[^a-zA-Z_]/g, '') ?? 'unknown';

//   try {
//     const result = await pool.query<T>(text, params);
//     logDbQuery({
//       operation,
//       table,
//       durationMs: Date.now() - start,
//       rowCount: result.rowCount ?? 0,
//     });
//     return result;
//   } catch (err) {
//     const error = err as Error;
//     logDbQuery({
//       operation,
//       table,
//       durationMs: Date.now() - start,
//       error: error.message,
//     });
//     throw err;
//   }
// }

// // ── Transaction helper ────────────────────────────────────────────────────────
// export async function withTransaction<T>(
//   fn: (client: PoolClient) => Promise<T>
// ): Promise<T> {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');
//     const result = await fn(client);
//     await client.query('COMMIT');
//     return result;
//   } catch (err) {
//     await client.query('ROLLBACK');
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// // ── Health check ──────────────────────────────────────────────────────────────
// export async function checkDbConnection(): Promise<void> {
//   const client = await pool.connect();
//   await client.query('SELECT 1');
//   client.release();
// }