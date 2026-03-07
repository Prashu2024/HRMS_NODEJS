import { Router } from 'express';
import {
  createAttendanceHandler,
  getEmployeeAttendanceHandler,
  getAllAttendancesHandler,
} from './attendance.controller';
import { authenticate } from '../../common/middleware';

const router = Router();

/**
 * POST /attendances/                            — Create attendance record
 * GET  /attendances/                            — Get all attendance records
 * GET  /attendances/employee/:employee_id       — Get attendance for one employee
 */
router.post('/',   authenticate, createAttendanceHandler);
router.get('/',    authenticate, getAllAttendancesHandler);
router.get('/employee/:employee_id', authenticate, getEmployeeAttendanceHandler);

export default router;