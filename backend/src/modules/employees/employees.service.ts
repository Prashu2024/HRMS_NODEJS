import {
    insertEmployee,
    findEmployeeByEmployeeId,
    findEmployeeByEmail,
    findEmployees,
    deleteEmployeeByEmployeeId,
    EmployeeRow,
    EmployeeListResult,
  } from './employees.repository';
  import { findAttendancesByEmployeeId, AttendanceRow } from '../attendance/attendance.repository';
  import { ConflictError, NotFoundError } from '../../common/errors';
  import { CreateEmployeeInput, ListEmployeesQuery } from './employees.validators';
  
  export interface EmployeeListResponse {
    employees: EmployeeRow[];
    total: number;
    skip: number;
    limit: number;
    has_next: boolean;
    has_prev: boolean;
  }
  
  export interface EmployeeWithAttendance extends EmployeeRow {
    attendances: AttendanceRow[];
  }
  
  // ── Create ────────────────────────────────────────────────────────────────────
  export function createEmployee(data: CreateEmployeeInput): EmployeeRow {
    const existingById    = findEmployeeByEmployeeId(data.employee_id);
    const existingByEmail = findEmployeeByEmail(data.email_address);
  
    if (existingById)    throw new ConflictError('Employee ID already exists');
    if (existingByEmail) throw new ConflictError('Email address already exists');
  
    return insertEmployee(data);
  }
  
  // ── List ──────────────────────────────────────────────────────────────────────
  export function listEmployees(q: ListEmployeesQuery): EmployeeListResponse {
    const { skip, limit, search } = q;
    const { employees, total }: EmployeeListResult = findEmployees(skip, limit, search);
    return {
      employees,
      total,
      skip,
      limit,
      has_next: skip + limit < total,
      has_prev: skip > 0,
    };
  }
  
  // ── Get one with attendance ───────────────────────────────────────────────────
  export function getEmployee(employeeId: string): EmployeeWithAttendance {
    const employee = findEmployeeByEmployeeId(employeeId);
    if (!employee) throw new NotFoundError('Employee');
  
    const attendances = findAttendancesByEmployeeId(employeeId);
    return { ...employee, attendances };
  }
  
  // ── Delete ────────────────────────────────────────────────────────────────────
  export function removeEmployee(employeeId: string): void {
    const employee = findEmployeeByEmployeeId(employeeId);
    if (!employee) throw new NotFoundError('Employee');
    deleteEmployeeByEmployeeId(employeeId);
  }




// import {
//     insertEmployee,
//     findEmployeeByEmployeeId,
//     findEmployeeByEmail,
//     findEmployees,
//     deleteEmployeeByEmployeeId,
//     EmployeeRow,
//     EmployeeListResult,
//   } from './employees.repository';
//   import { findAttendancesByEmployeeId } from '../attendance/attendance.repository';
//   import { ConflictError, NotFoundError } from '../../common/errors';
//   import { CreateEmployeeInput, ListEmployeesQuery } from './employees.validators';
  
//   export interface EmployeeListResponse {
//     employees: EmployeeRow[];
//     total: number;
//     skip: number;
//     limit: number;
//     has_next: boolean;
//     has_prev: boolean;
//   }
  
//   export interface EmployeeWithAttendance extends EmployeeRow {
//     attendances: Awaited<ReturnType<typeof findAttendancesByEmployeeId>>;
//   }
  
//   // ── Create ────────────────────────────────────────────────────────────────────
//   export async function createEmployee(data: CreateEmployeeInput): Promise<EmployeeRow> {
//     const [existingById, existingByEmail] = await Promise.all([
//       findEmployeeByEmployeeId(data.employee_id),
//       findEmployeeByEmail(data.email_address),
//     ]);
  
//     if (existingById) throw new ConflictError('Employee ID already exists');
//     if (existingByEmail) throw new ConflictError('Email address already exists');
  
//     return insertEmployee(data);
//   }
  
//   // ── List ──────────────────────────────────────────────────────────────────────
//   export async function listEmployees(q: ListEmployeesQuery): Promise<EmployeeListResponse> {
//     const { skip, limit, search } = q;
//     const { employees, total }: EmployeeListResult = await findEmployees(skip, limit, search);
//     return {
//       employees,
//       total,
//       skip,
//       limit,
//       has_next: skip + limit < total,
//       has_prev: skip > 0,
//     };
//   }
  
//   // ── Get one with attendance ───────────────────────────────────────────────────
//   export async function getEmployee(employeeId: string): Promise<EmployeeWithAttendance> {
//     const employee = await findEmployeeByEmployeeId(employeeId);
//     if (!employee) throw new NotFoundError('Employee');
  
//     const attendances = await findAttendancesByEmployeeId(employeeId);
//     return { ...employee, attendances };
//   }
  
//   // ── Delete ────────────────────────────────────────────────────────────────────
//   export async function removeEmployee(employeeId: string): Promise<void> {
//     const employee = await findEmployeeByEmployeeId(employeeId);
//     if (!employee) throw new NotFoundError('Employee');
//     await deleteEmployeeByEmployeeId(employeeId);
//   }