import { z } from 'zod';

export const userRoles = ['admin', 'manager', 'staff'] as const;
export type UserRole = (typeof userRoles)[number];

export const registerUserSchema = z.object({
  username: z
    .string()
    .min(3, 'username must be at least 3 characters')
    .max(100, 'username must be at most 100 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be at most 128 characters')
    .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'password must contain at least one number'),
  role: z.enum(userRoles).optional().default('staff'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

export const listUsersSchema = z.object({
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
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;