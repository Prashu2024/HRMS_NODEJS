import { query, run } from '../../database';
import { CreateEmployeeInput } from './employees.validators';

export interface EmployeeRow {
  id: number;
  employee_id: string;
  full_name: string;
  email_address: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListResult {
  employees: EmployeeRow[];
  total: number;
}

// ── Insert ────────────────────────────────────────────────────────────────────
export function insertEmployee(data: CreateEmployeeInput): EmployeeRow {
  // Insert then fetch — SQLite RETURNING works but .all() is safer across versions
  run(
    `INSERT INTO employees (employee_id, full_name, email_address, department)
     VALUES (?, ?, ?, ?)`,
    [data.employee_id, data.full_name, data.email_address, data.department]
  );
  const rows = query<EmployeeRow>(
    `SELECT * FROM employees WHERE employee_id = ? LIMIT 1`,
    [data.employee_id]
  );
  return rows[0] as EmployeeRow;
}

// ── Find by employee_id ───────────────────────────────────────────────────────
export function findEmployeeByEmployeeId(employeeId: string): EmployeeRow | null {
  const rows = query<EmployeeRow>(
    `SELECT * FROM employees WHERE employee_id = ? LIMIT 1`,
    [employeeId]
  );
  return rows[0] ?? null;
}

// ── Find by email ─────────────────────────────────────────────────────────────
export function findEmployeeByEmail(email: string): EmployeeRow | null {
  const rows = query<EmployeeRow>(
    `SELECT * FROM employees WHERE email_address = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

// ── Paginated list with optional search ───────────────────────────────────────
// SQLite LIKE is case-insensitive for ASCII by default (matches ILIKE behaviour)
export function findEmployees(
  skip: number,
  limit: number,
  search?: string
): EmployeeListResult {
  if (search) {
    const term = `%${search}%`;
    const whereClause = `
      WHERE full_name     LIKE ?
         OR email_address LIKE ?
         OR department    LIKE ?
         OR employee_id   LIKE ?
    `;
    const params = [term, term, term, term];

    const countRows = query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM employees ${whereClause}`,
      params
    );
    const dataRows = query<EmployeeRow>(
      `SELECT * FROM employees ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
      [...params, limit, skip]
    );
    return {
      employees: dataRows,
      total: countRows[0]?.total ?? 0,
    };
  }

  const countRows = query<{ total: number }>(`SELECT COUNT(*) AS total FROM employees`);
  const dataRows  = query<EmployeeRow>(
    `SELECT * FROM employees ORDER BY id LIMIT ? OFFSET ?`,
    [limit, skip]
  );
  return {
    employees: dataRows,
    total: countRows[0]?.total ?? 0,
  };
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function deleteEmployeeByEmployeeId(employeeId: string): boolean {
  // FK cascade removes attendance rows automatically (foreign_keys = ON)
  const result = run(`DELETE FROM employees WHERE employee_id = ?`, [employeeId]);
  return result.changes > 0;
}


// import { query } from '../../database';
// import { CreateEmployeeInput } from './employees.validators';

// export interface EmployeeRow {
//   id: number;
//   employee_id: string;
//   full_name: string;
//   email_address: string;
//   department: string;
//   created_at: Date;
//   updated_at: Date;
// }

// export interface EmployeeListResult {
//   employees: EmployeeRow[];
//   total: number;
// }

// // ── Insert ────────────────────────────────────────────────────────────────────
// export async function insertEmployee(data: CreateEmployeeInput): Promise<EmployeeRow> {
//   const sql = `
//     INSERT INTO employees (employee_id, full_name, email_address, department)
//     VALUES ($1, $2, $3, $4)
//     RETURNING *
//   `;
//   const result = await query<EmployeeRow>(sql, [
//     data.employee_id,
//     data.full_name,
//     data.email_address,
//     data.department,
//   ]);
//   return result.rows[0];
// }

// // ── Find by employee_id ───────────────────────────────────────────────────────
// export async function findEmployeeByEmployeeId(
//   employeeId: string
// ): Promise<EmployeeRow | null> {
//   const sql = `SELECT * FROM employees WHERE employee_id = $1 LIMIT 1`;
//   const result = await query<EmployeeRow>(sql, [employeeId]);
//   return result.rows[0] ?? null;
// }

// // ── Find by email ─────────────────────────────────────────────────────────────
// export async function findEmployeeByEmail(email: string): Promise<EmployeeRow | null> {
//   const sql = `SELECT * FROM employees WHERE email_address = $1 LIMIT 1`;
//   const result = await query<EmployeeRow>(sql, [email]);
//   return result.rows[0] ?? null;
// }

// // ── Paginated list with optional search ───────────────────────────────────────
// export async function findEmployees(
//   skip: number,
//   limit: number,
//   search?: string
// ): Promise<EmployeeListResult> {
//   if (search) {
//     const term = `%${search}%`;
//     const countSql = `
//       SELECT COUNT(*)::int AS total FROM employees
//       WHERE  full_name     ILIKE $1
//           OR email_address ILIKE $1
//           OR department    ILIKE $1
//           OR employee_id   ILIKE $1
//     `;
//     const dataSql = `
//       SELECT * FROM employees
//       WHERE  full_name     ILIKE $1
//           OR email_address ILIKE $1
//           OR department    ILIKE $1
//           OR employee_id   ILIKE $1
//       ORDER BY id
//       OFFSET $2 LIMIT $3
//     `;
//     const [countResult, dataResult] = await Promise.all([
//       query<{ total: number }>(countSql, [term]),
//       query<EmployeeRow>(dataSql, [term, skip, limit]),
//     ]);
//     return {
//       employees: dataResult.rows,
//       total: countResult.rows[0]?.total ?? 0,
//     };
//   }

//   const countSql = `SELECT COUNT(*)::int AS total FROM employees`;
//   const dataSql  = `SELECT * FROM employees ORDER BY id OFFSET $1 LIMIT $2`;

//   const [countResult, dataResult] = await Promise.all([
//     query<{ total: number }>(countSql),
//     query<EmployeeRow>(dataSql, [skip, limit]),
//   ]);
//   return {
//     employees: dataResult.rows,
//     total: countResult.rows[0]?.total ?? 0,
//   };
// }

// // ── Delete ────────────────────────────────────────────────────────────────────
// export async function deleteEmployeeByEmployeeId(employeeId: string): Promise<boolean> {
//   // Attendance rows cascade via FK; delete employee directly
//   const sql = `DELETE FROM employees WHERE employee_id = $1`;
//   const result = await query(sql, [employeeId]);
//   return (result.rowCount ?? 0) > 0;
// }