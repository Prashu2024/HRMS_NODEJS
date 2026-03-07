import { Request, Response, NextFunction } from 'express';
import { createEmployeeSchema, listEmployeesSchema } from './employees.validators';
import { createEmployee, listEmployees, getEmployee, removeEmployee } from './employees.service';

export function createEmployeeHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const data     = createEmployeeSchema.parse(req.body);
    const employee = createEmployee(data);
    res.status(201).json({ status: 'success', data: employee });
  } catch (err) {
    next(err);
  }
}

export function listEmployeesHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const q      = listEmployeesSchema.parse(req.query);
    const result = listEmployees(q);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

export function getEmployeeHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    const employee = getEmployee(req.params['employee_id'] ?? '');
    res.status(200).json({ status: 'success', data: employee });
  } catch (err) {
    next(err);
  }
}

export function deleteEmployeeHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    removeEmployee(req.params['employee_id'] ?? '');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}



// import { Request, Response, NextFunction } from 'express';
// import { createEmployeeSchema, listEmployeesSchema } from './employees.validators';
// import {
//   createEmployee,
//   listEmployees,
//   getEmployee,
//   removeEmployee,
// } from './employees.service';

// export async function createEmployeeHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const data = createEmployeeSchema.parse(req.body);
//     const employee = await createEmployee(data);
//     res.status(201).json({ status: 'success', data: employee });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function listEmployeesHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const query = listEmployeesSchema.parse(req.query);
//     const result = await listEmployees(query);
//     res.status(200).json({ status: 'success', data: result });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function getEmployeeHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const employee = await getEmployee(req.params.employee_id);
//     res.status(200).json({ status: 'success', data: employee });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function deleteEmployeeHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     await removeEmployee(req.params.employee_id);
//     res.status(204).send();
//   } catch (err) {
//     next(err);
//   }
// }