import {
    insertAttendance,
    findAttendanceByEmployeeAndDate,
    findAttendancesByEmployeeId,
    findAllAttendances,
    AttendanceRow,
  } from './attendance.repository';
  import { findEmployeeByEmployeeId } from '../employees/employees.repository';
  import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors';
  import { CreateAttendanceInput, GetAttendanceQuery } from './attendance.validators';
  
  // ── Create ────────────────────────────────────────────────────────────────────
  export function createAttendance(data: CreateAttendanceInput): AttendanceRow {
    const employee = findEmployeeByEmployeeId(data.employee_id);
    if (!employee) throw new NotFoundError('Employee');
  
    const existing = findAttendanceByEmployeeAndDate(data.employee_id, data.date);
    if (existing) throw new ConflictError('Attendance record already exists for this date');
  
    return insertAttendance(data);
  }
  
  // ── Get by employee ───────────────────────────────────────────────────────────
  export function getEmployeeAttendance(
    employeeId: string,
    q: GetAttendanceQuery
  ): AttendanceRow[] {
    const employee = findEmployeeByEmployeeId(employeeId);
    if (!employee) throw new NotFoundError('Employee');
  
    if (q.start_date && q.end_date && q.start_date > q.end_date) {
      throw new BadRequestError('start_date must be before or equal to end_date');
    }
  
    return findAttendancesByEmployeeId(employeeId, q.start_date, q.end_date);
  }
  
  // ── Get all ───────────────────────────────────────────────────────────────────
  export function getAllAttendances(): AttendanceRow[] {
    return findAllAttendances();
  }




// import {
//     insertAttendance,
//     findAttendanceByEmployeeAndDate,
//     findAttendancesByEmployeeId,
//     findAllAttendances,
//     AttendanceRow,
//   } from './attendance.repository';
//   import { findEmployeeByEmployeeId } from '../employees/employees.repository';
//   import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors';
//   import { CreateAttendanceInput, GetAttendanceQuery } from './attendance.validators';
  
//   // ── Create ────────────────────────────────────────────────────────────────────
//   export async function createAttendance(data: CreateAttendanceInput): Promise<AttendanceRow> {
//     const employee = await findEmployeeByEmployeeId(data.employee_id);
//     if (!employee) throw new NotFoundError('Employee');
  
//     const existing = await findAttendanceByEmployeeAndDate(data.employee_id, data.date);
//     if (existing) throw new ConflictError('Attendance record already exists for this date');
  
//     return insertAttendance(data);
//   }
  
//   // ── Get by employee ───────────────────────────────────────────────────────────
//   export async function getEmployeeAttendance(
//     employeeId: string,
//     q: GetAttendanceQuery
//   ): Promise<AttendanceRow[]> {
//     const employee = await findEmployeeByEmployeeId(employeeId);
//     if (!employee) throw new NotFoundError('Employee');
  
//     // Validate date order if both provided
//     if (q.start_date && q.end_date && q.start_date > q.end_date) {
//       throw new BadRequestError('start_date must be before or equal to end_date');
//     }
  
//     return findAttendancesByEmployeeId(employeeId, q.start_date, q.end_date);
//   }
  
//   // ── Get all ───────────────────────────────────────────────────────────────────
//   export async function getAllAttendances(): Promise<AttendanceRow[]> {
//     return findAllAttendances();
//   }