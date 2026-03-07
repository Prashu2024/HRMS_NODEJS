import { query, run } from '../../database';
import { RegisterUserInput } from './validators';

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: number;   // SQLite stores BOOLEAN as 0/1
  created_at: string;
  updated_at: string;
}

/** Safe projection — never returns password_hash */
export type SafeUserRow = Omit<UserRow, 'password_hash'>;

// ── Insert ────────────────────────────────────────────────────────────────────
export function insertUser(
  data: Omit<RegisterUserInput, 'password'> & { password_hash: string }
): SafeUserRow {
  const result = run(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [data.username, data.email, data.password_hash, data.role]
  );
  const rows = query<SafeUserRow>(
    `SELECT id, username, email, role, is_active, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [result.lastInsertRowid]
  );
  return rows[0] as SafeUserRow;
}

// ── Find by username (includes password_hash for login) ───────────────────────
export function findUserByUsername(username: string): UserRow | null {
  const rows = query<UserRow>(
    `SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1`,
    [username]
  );
  return rows[0] ?? null;
}

// ── Find by email ─────────────────────────────────────────────────────────────
export function findUserByEmail(email: string): UserRow | null {
  const rows = query<UserRow>(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

// ── Find by id (safe) ─────────────────────────────────────────────────────────
export function findUserById(id: number): SafeUserRow | null {
  const rows = query<SafeUserRow>(
    `SELECT id, username, email, role, is_active, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

// ── Paginated list (safe) ─────────────────────────────────────────────────────
export function findAllUsers(
  skip: number,
  limit: number
): { users: SafeUserRow[]; total: number } {
  const countRows = query<{ total: number }>(`SELECT COUNT(*) AS total FROM users`);
  const dataRows  = query<SafeUserRow>(
    `SELECT id, username, email, role, is_active, created_at, updated_at
     FROM users ORDER BY id LIMIT ? OFFSET ?`,
    [limit, skip]
  );
  return { users: dataRows, total: countRows[0]?.total ?? 0 };
}

// ── Deactivate (soft delete) ──────────────────────────────────────────────────
export function deactivateUser(id: number): boolean {
  const result = run(`UPDATE users SET is_active = 0 WHERE id = ?`, [id]);
  return result.changes > 0;
}



// import { query } from '../../database';
// import { RegisterUserInput } from './users.validators';

// export interface UserRow {
//   id: number;
//   username: string;
//   email: string;
//   password_hash: string;
//   role: string;
//   is_active: boolean;
//   created_at: Date;
//   updated_at: Date;
// }

// /** Safe projection — never returns password_hash */
// export type SafeUserRow = Omit<UserRow, 'password_hash'>;

// // ── Insert ────────────────────────────────────────────────────────────────────
// export async function insertUser(
//   data: Omit<RegisterUserInput, 'password'> & { password_hash: string }
// ): Promise<SafeUserRow> {
//   const sql = `
//     INSERT INTO users (username, email, password_hash, role)
//     VALUES ($1, $2, $3, $4)
//     RETURNING id, username, email, role, is_active, created_at, updated_at
//   `;
//   const result = await query<SafeUserRow>(sql, [
//     data.username,
//     data.email,
//     data.password_hash,
//     data.role,
//   ]);
//   return result.rows[0];
// }

// // ── Find by username (includes password_hash for login) ───────────────────────
// export async function findUserByUsername(username: string): Promise<UserRow | null> {
//   const sql = `SELECT * FROM users WHERE username = $1 AND is_active = TRUE LIMIT 1`;
//   const result = await query<UserRow>(sql, [username]);
//   return result.rows[0] ?? null;
// }

// // ── Find by email ─────────────────────────────────────────────────────────────
// export async function findUserByEmail(email: string): Promise<UserRow | null> {
//   const sql = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
//   const result = await query<UserRow>(sql, [email]);
//   return result.rows[0] ?? null;
// }

// // ── Find by id (safe) ─────────────────────────────────────────────────────────
// export async function findUserById(id: number): Promise<SafeUserRow | null> {
//   const sql = `
//     SELECT id, username, email, role, is_active, created_at, updated_at
//     FROM users WHERE id = $1 LIMIT 1
//   `;
//   const result = await query<SafeUserRow>(sql, [id]);
//   return result.rows[0] ?? null;
// }

// // ── Paginated list (safe) ─────────────────────────────────────────────────────
// export async function findAllUsers(
//   skip: number,
//   limit: number
// ): Promise<{ users: SafeUserRow[]; total: number }> {
//   const countSql = `SELECT COUNT(*)::int AS total FROM users`;
//   const dataSql  = `
//     SELECT id, username, email, role, is_active, created_at, updated_at
//     FROM users ORDER BY id OFFSET $1 LIMIT $2
//   `;
//   const [countResult, dataResult] = await Promise.all([
//     query<{ total: number }>(countSql),
//     query<SafeUserRow>(dataSql, [skip, limit]),
//   ]);
//   return {
//     users: dataResult.rows,
//     total: countResult.rows[0]?.total ?? 0,
//   };
// }

// // ── Deactivate (soft delete) ──────────────────────────────────────────────────
// export async function deactivateUser(id: number): Promise<boolean> {
//   const sql = `UPDATE users SET is_active = FALSE WHERE id = $1`;
//   const result = await query(sql, [id]);
//   return (result.rowCount ?? 0) > 0;
// }