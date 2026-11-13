import { z } from 'zod';
import { USER_ROLES } from '../constants/auth';

const username = z
  .string({ required_error: 'Username is required' })
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9._-]+$/, 'Use only letters, numbers, dot, dash or underscore');

export const password = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');

const name = z.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required').max(100);
const role = z.enum(USER_ROLES, { errorMap: () => ({ message: 'Select admin or worker' }) });

export const loginSchema = z.object({
  username: z.string({ required_error: 'Enter your username' }).trim().toLowerCase().min(1, 'Enter your username'),
  password: z.string({ required_error: 'Enter your password' }).min(1, 'Enter your password'),
});

export const createUserSchema = z.object({ name, username, password, role });

export const updateUserSchema = z.object({
  name: name.optional(),
  role: role.optional(),
  active: z.boolean().optional(),
  // Optional: set only when resetting the password.
  password: password.optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
