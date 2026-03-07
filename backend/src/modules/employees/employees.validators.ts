import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'employee_id is required')
    .max(50, 'employee_id must be at most 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'employee_id can only contain letters, numbers, hyphens, and underscores'),
  full_name: z
    .string()
    .min(1, 'full_name is required')
    .max(255, 'full_name must be at most 255 characters')
    .trim(),
  email_address: z
    .string()
    .email('Invalid email format')
    .max(255, 'email must be at most 255 characters')
    .toLowerCase(),
  department: z
    .string()
    .min(1, 'department is required')
    .max(100, 'department must be at most 100 characters')
    .trim(),
});

export const listEmployeesSchema = z.object({
  skip: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .pipe(z.number().int().min(0)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>;