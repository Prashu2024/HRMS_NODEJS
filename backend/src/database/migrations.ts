import { db } from './index';
import logger from '../common/logger';

export function runMigrations(): void {
  logger.info('Running SQLite migrations...');

  // Use a transaction so the whole schema applies atomically
  db.transaction(() => {

    // ── Users ──────────────────────────────────────────────────────────────
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT    UNIQUE NOT NULL COLLATE NOCASE,
        email         TEXT    UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT    NOT NULL,
        role          TEXT    NOT NULL DEFAULT 'staff'
                              CHECK (role IN ('admin', 'manager', 'staff')),
        is_active     INTEGER NOT NULL DEFAULT 1,
        created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `).run();

    // ── Employees ──────────────────────────────────────────────────────────
    db.prepare(`
      CREATE TABLE IF NOT EXISTS employees (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id   TEXT    UNIQUE NOT NULL,
        full_name     TEXT    NOT NULL,
        email_address TEXT    UNIQUE NOT NULL COLLATE NOCASE,
        department    TEXT    NOT NULL,
        created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `).run();

    // ── Attendances ────────────────────────────────────────────────────────
    db.prepare(`
      CREATE TABLE IF NOT EXISTS attendances (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT    NOT NULL
                    REFERENCES employees(employee_id) ON DELETE CASCADE,
        date        TEXT    NOT NULL,
        status      TEXT    NOT NULL CHECK (status IN ('present', 'absent')),
        created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE (employee_id, date)
      )
    `).run();

    // ── Indexes ────────────────────────────────────────────────────────────
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employees_department
                ON employees(department)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employees_full_name
                ON employees(full_name)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_attendances_date
                ON attendances(date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_attendances_emp_date
                ON attendances(employee_id, date)`).run();
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_users_username
                ON users(username)`).run();

    // ── updated_at triggers (SQLite equivalent) ────────────────────────────
    for (const table of ['users', 'employees', 'attendances']) {
      db.prepare(`
        CREATE TRIGGER IF NOT EXISTS trg_${table}_updated_at
        AFTER UPDATE ON ${table}
        FOR EACH ROW
        BEGIN
          UPDATE ${table}
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = OLD.id;
        END
      `).run();
    }

  })();

  logger.info('SQLite migrations completed successfully');
}

// import { pool } from './index';
// import logger from '../common/logger';

// export async function runMigrations(): Promise<void> {
//   const client = await pool.connect();
//   try {
//     logger.info('Running database migrations...');

//     // ── Enable uuid extension if available ─────────────────────────────────
//     await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

//     // ── Users table ────────────────────────────────────────────────────────
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         id            SERIAL PRIMARY KEY,
//         username      VARCHAR(100) UNIQUE NOT NULL,
//         email         VARCHAR(255) UNIQUE NOT NULL,
//         password_hash VARCHAR(255) NOT NULL,
//         role          VARCHAR(50) NOT NULL DEFAULT 'staff',
//         is_active     BOOLEAN NOT NULL DEFAULT TRUE,
//         created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//         updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
//       );
//     `);

//     // ── Employees table ────────────────────────────────────────────────────
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS employees (
//         id            SERIAL PRIMARY KEY,
//         employee_id   VARCHAR(50) UNIQUE NOT NULL,
//         full_name     VARCHAR(255) NOT NULL,
//         email_address VARCHAR(255) UNIQUE NOT NULL,
//         department    VARCHAR(100) NOT NULL,
//         created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//         updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
//       );
//     `);

//     // ── Attendances table ──────────────────────────────────────────────────
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS attendances (
//         id          SERIAL PRIMARY KEY,
//         employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
//         date        DATE NOT NULL,
//         status      VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
//         created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//         updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//         CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, date)
//       );
//     `);

//     // ── Indexes ────────────────────────────────────────────────────────────
//     await client.query(`
//       CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
//       CREATE INDEX IF NOT EXISTS idx_employees_full_name  ON employees(full_name);
//       CREATE INDEX IF NOT EXISTS idx_attendances_date     ON attendances(date);
//       CREATE INDEX IF NOT EXISTS idx_attendances_emp_date ON attendances(employee_id, date);
//       CREATE INDEX IF NOT EXISTS idx_users_username       ON users(username);
//     `);

//     // ── updated_at auto-update trigger ─────────────────────────────────────
//     await client.query(`
//       CREATE OR REPLACE FUNCTION update_updated_at_column()
//       RETURNS TRIGGER AS $$
//       BEGIN
//         NEW.updated_at = NOW();
//         RETURN NEW;
//       END;
//       $$ LANGUAGE plpgsql;
//     `);

//     for (const table of ['users', 'employees', 'attendances']) {
//       await client.query(`
//         DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};
//         CREATE TRIGGER trg_${table}_updated_at
//           BEFORE UPDATE ON ${table}
//           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
//       `);
//     }

//     logger.info('Database migrations completed successfully');
//   } catch (err) {
//     logger.error('Migration failed', { error: (err as Error).message });
//     throw err;
//   } finally {
//     client.release();
//   }
// }