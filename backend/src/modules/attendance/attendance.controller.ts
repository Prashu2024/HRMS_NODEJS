import { Request, Response, NextFunction } from 'express';
import { createAttendanceSchema, getAttendanceQuerySchema } from './attendance.validators';
import { createAttendance, getEmployeeAttendance, getAllAttendances } from './attendance.service';

export function createAttendanceHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const data       = createAttendanceSchema.parse(req.body);
    const attendance = createAttendance(data);
    res.status(201).json({ status: 'success', data: attendance });
  } catch (err) {
    next(err);
  }
}

export function getEmployeeAttendanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const q           = getAttendanceQuerySchema.parse(req.query);
    const attendances = getEmployeeAttendance(req.params['employee_id'] ?? '', q);
    res.status(200).json({ status: 'success', data: attendances });
  } catch (err) {
    next(err);
  }
}

export function getAllAttendancesHandler(_req: Request, res: Response, next: NextFunction): void {
  try {
    const attendances = getAllAttendances();
    res.status(200).json({ status: 'success', data: attendances });
  } catch (err) {
    next(err);
  }
}

// import { Request, Response, NextFunction } from 'express';
// import { createAttendanceSchema, getAttendanceQuerySchema } from './attendance.validators';
// import { createAttendance, getEmployeeAttendance, getAllAttendances } from './attendance.service';

// export async function createAttendanceHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const data = createAttendanceSchema.parse(req.body);
//     const attendance = await createAttendance(data);
//     res.status(201).json({ status: 'success', data: attendance });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getEmployeeAttendanceHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const query = getAttendanceQuerySchema.parse(req.query);
//     const attendances = await getEmployeeAttendance(req.params.employee_id, query);
//     res.status(200).json({ status: 'success', data: attendances });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getAllAttendancesHandler(
//   _req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const attendances = await getAllAttendances();
//     res.status(200).json({ status: 'success', data: attendances });
//   } catch (err) {
//     next(err);
//   }
// }