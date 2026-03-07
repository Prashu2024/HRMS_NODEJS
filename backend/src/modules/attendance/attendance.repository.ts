import { query, run } from '../../database';
import { CreateAttendanceInput, AttendanceStatus } from './attendance.validators';

export interface AttendanceRow {
  id: number;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

// ── Insert ────────────────────────────────────────────────────────────────────
export function insertAttendance(data: CreateAttendanceInput): AttendanceRow {
  const result = run(
    `INSERT INTO attendances (employee_id, date, status) VALUES (?, ?, ?)`,
    [data.employee_id, data.date, data.status]
  );
  const rows = query<AttendanceRow>(
    `SELECT * FROM attendances WHERE id = ? LIMIT 1`,
    [result.lastInsertRowid]
  );
  return rows[0] as AttendanceRow;
}

// ── Check duplicate ───────────────────────────────────────────────────────────
export function findAttendanceByEmployeeAndDate(
  employeeId: string,
  date: string
): AttendanceRow | null {
  const rows = query<AttendanceRow>(
    `SELECT * FROM attendances WHERE employee_id = ? AND date = ? LIMIT 1`,
    [employeeId, date]
  );
  return rows[0] ?? null;
}

// ── Get all for an employee (with optional date range) ────────────────────────
export function findAttendancesByEmployeeId(
  employeeId: string,
  startDate?: string,
  endDate?: string
): AttendanceRow[] {
  const conditions: string[] = ['employee_id = ?'];
  const params: unknown[] = [employeeId];

  if (startDate) {
    conditions.push('date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('date <= ?');
    params.push(endDate);
  }

  return query<AttendanceRow>(
    `SELECT * FROM attendances WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
    params
  );
}

// ── Get all attendances ───────────────────────────────────────────────────────
export function findAllAttendances(): AttendanceRow[] {
  return query<AttendanceRow>(`SELECT * FROM attendances ORDER BY date DESC`);
}


// import { query } from '../../database';
// import { CreateAttendanceInput, AttendanceStatus } from './attendance.validators';

// export interface AttendanceRow {
//   id: number;
//   employee_id: string;
//   date: Date;
//   status: AttendanceStatus;
//   created_at: Date;
//   updated_at: Date;
// }

// // ── Insert ────────────────────────────────────────────────────────────────────
// export async function insertAttendance(
//   data: CreateAttendanceInput
// ): Promise<AttendanceRow> {
//   const sql = `
//     INSERT INTO attendances (employee_id, date, status)
//     VALUES ($1, $2, $3)
//     RETURNING *
//   `;
//   const result = await query<AttendanceRow>(sql, [
//     data.employee_id,
//     data.date,
//     data.status,
//   ]);
//   return result.rows[0];
// }

// // ── Check duplicate ───────────────────────────────────────────────────────────
// export async function findAttendanceByEmployeeAndDate(
//   employeeId: string,
//   date: string
// ): Promise<AttendanceRow | null> {
//   const sql = `
//     SELECT * FROM attendances
//     WHERE employee_id = $1 AND date = $2
//     LIMIT 1
//   `;
//   const result = await query<AttendanceRow>(sql, [employeeId, date]);
//   return result.rows[0] ?? null;
// }

// // ── Get all for an employee (with optional date range) ────────────────────────
// export async function findAttendancesByEmployeeId(
//   employeeId: string,
//   startDate?: string,
//   endDate?: string
// ): Promise<AttendanceRow[]> {
//   const conditions: string[] = ['employee_id = $1'];
//   const params: unknown[] = [employeeId];
//   let idx = 2;

//   if (startDate) {
//     conditions.push(`date >= $${idx++}`);
//     params.push(startDate);
//   }
//   if (endDate) {
//     conditions.push(`date <= $${idx++}`);
//     params.push(endDate);
//   }

//   const sql = `
//     SELECT * FROM attendances
//     WHERE  ${conditions.join(' AND ')}
//     ORDER BY date DESC
//   `;
//   const result = await query<AttendanceRow>(sql, params);
//   return result.rows;
// }

// // ── Get all attendances ───────────────────────────────────────────────────────
// export async function findAllAttendances(): Promise<AttendanceRow[]> {
//   const sql = `SELECT * FROM attendances ORDER BY date DESC`;
//   const result = await query<AttendanceRow>(sql);
//   return result.rows;
// }