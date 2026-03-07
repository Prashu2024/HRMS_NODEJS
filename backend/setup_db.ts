/**
 * Standalone database setup script.
 *
 * Run once before first use — or re-run any time (fully idempotent):
 *   npx ts-node-dev --transpile-only scripts/setup-db.ts
 *   -- OR --
 *   npm run db:setup
 *
 * What it does:
 *   1. Creates the data/ directory if it does not exist
 *   2. Opens (or creates) the SQLite .db file
 *   3. Creates all tables, indexes and triggers
 *   4. Logs a summary of tables found in the file
 */

import { db, closeDb } from './src/database';
import { runMigrations } from './src/database/migrations';
import logger from './src/common/logger';
import { config } from './src/config/index';

console.log('\n🚀  HRMS Lite — SQLite Database Setup\n');
console.log(`📂  DB file : ${config.db.path}`);
console.log(`📋  Mode    : ${config.server.nodeEnv}\n`);

try {
  runMigrations();

  // Report what tables now exist
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
    .all() as Array<{ name: string }>;

  console.log('✅  Tables created / verified:');
  tables.forEach(({ name }) => console.log(`     • ${name}`));

  // Report indexes
  const indexes = db
    .prepare(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name`)
    .all() as Array<{ name: string; tbl_name: string }>;

  console.log('\n📑  Indexes:');
  indexes.forEach(({ name, tbl_name }) => console.log(`     • ${name}  →  ${tbl_name}`));

  console.log(`\n✅  Database ready at: ${config.db.path}`);
  console.log('🎯  Next step: npm run dev\n');
} catch (err) {
  logger.error('Setup failed', { error: (err as Error).message });
  console.error('\n❌  Setup failed:', (err as Error).message);
  process.exit(1);
} finally {
  closeDb();
}