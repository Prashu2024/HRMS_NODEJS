import { z } from 'zod';

export const attendanceStatusValues = ['present', 'absent'] as const;
export type AttendanceStatus = (typeof attendanceStatusValues)[number];

export const createAttendanceSchema = z.object({
  employee_id: z.string().min(1, 'employee_id is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), { message: 'date is not a valid date' }),
  status: z.enum(attendanceStatusValues, {
    errorMap: () => ({ message: 'status must be "present" or "absent"' }),
  }),
});

export const getAttendanceQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
    .optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type GetAttendanceQuery = z.infer<typeof getAttendanceQuerySchema>;