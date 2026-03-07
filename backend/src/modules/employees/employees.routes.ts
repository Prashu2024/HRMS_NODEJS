import { Router } from 'express';
import {
  createEmployeeHandler,
  listEmployeesHandler,
  getEmployeeHandler,
  deleteEmployeeHandler,
} from './employees.controller';
import { authenticate } from '../../common/middleware';

const router = Router();

/**
 * POST   /employees/       — Create a new employee
 * GET    /employees/       — List employees (paginated + search)
 * GET    /employees/:id    — Get single employee with attendance
 * DELETE /employees/:id    — Delete employee (cascades attendance)
 */
router.post('/',    authenticate, createEmployeeHandler);
router.get('/',     authenticate, listEmployeesHandler);
router.get('/:employee_id',  authenticate, getEmployeeHandler);
router.delete('/:employee_id', authenticate, deleteEmployeeHandler);

export default router;