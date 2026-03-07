import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  insertUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  findAllUsers,
  deactivateUser,
  SafeUserRow,
} from './users.repository';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../common/errors';
import { RegisterUserInput, LoginInput, ListUsersQuery } from './users.validators';
import { config } from '../../config';
import { logSecurity } from '../../common/logger';

const BCRYPT_ROUNDS = 12;

// ── Register ──────────────────────────────────────────────────────────────────
export async function registerUser(data: RegisterUserInput): Promise<SafeUserRow> {
  const existingByUsername = findUserByUsername(data.username);
  const existingByEmail    = findUserByEmail(data.email);

  if (existingByUsername) throw new ConflictError('Username already exists');
  if (existingByEmail)    throw new ConflictError('Email already exists');

  const password_hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  return insertUser({ username: data.username, email: data.email, password_hash, role: data.role });
}

// ── Login ─────────────────────────────────────────────────────────────────────
// bcrypt.compare is async so login stays async
export async function loginUser(
  data: LoginInput,
  ip?: string
): Promise<{ user: SafeUserRow; token: string }> {
  const user = findUserByUsername(data.username);

  if (!user) {
    logSecurity({ event: 'login_attempt', success: false, reason: 'user_not_found', ip });
    // Constant-time dummy compare to prevent user enumeration via timing
    await bcrypt.compare(data.password, '$2b$12$invalidhashinvalidhashinvalidhas');
    throw new UnauthorizedError('Invalid username or password');
  }

  const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordMatch) {
    logSecurity({ event: 'login_attempt', userId: user.id, success: false, reason: 'wrong_password', ip });
    throw new UnauthorizedError('Invalid username or password');
  }

  logSecurity({ event: 'login_attempt', userId: user.id, success: true, ip });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  const { password_hash: _ph, ...safeUser } = user;
  return { user: safeUser as SafeUserRow, token };
}

// ── Get user profile ──────────────────────────────────────────────────────────
export function getUserProfile(id: number): SafeUserRow {
  const user = findUserById(id);
  if (!user) throw new NotFoundError('User');
  return user;
}

// ── List users ────────────────────────────────────────────────────────────────
export function listUsers(q: ListUsersQuery): {
  users: SafeUserRow[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
} {
  const { skip, limit } = q;
  const { users, total } = findAllUsers(skip, limit);
  return { users, total, skip, limit, has_next: skip + limit < total, has_prev: skip > 0 };
}

// ── Deactivate user ───────────────────────────────────────────────────────────
export function deactivateUserById(id: number): void {
  const user = findUserById(id);
  if (!user) throw new NotFoundError('User');
  deactivateUser(id);
  logSecurity({ event: 'user_deactivated', userId: id, success: true });
}


// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import {
//   insertUser,
//   findUserByUsername,
//   findUserByEmail,
//   findUserById,
//   findAllUsers,
//   deactivateUser,
//   SafeUserRow,
// } from './users.repository';
// import { ConflictError, NotFoundError, UnauthorizedError } from '../../common/errors';
// import { RegisterUserInput, LoginInput, ListUsersQuery } from './users.validators';
// import { config } from '../../config/index';
// import { logSecurity } from '../../common/logger';

// const BCRYPT_ROUNDS = 12;

// // ── Register ──────────────────────────────────────────────────────────────────
// export async function registerUser(data: RegisterUserInput): Promise<SafeUserRow> {
//   const [existingByUsername, existingByEmail] = await Promise.all([
//     findUserByUsername(data.username),
//     findUserByEmail(data.email),
//   ]);

//   if (existingByUsername) throw new ConflictError('Username already exists');
//   if (existingByEmail) throw new ConflictError('Email already exists');

//   const password_hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
//   return insertUser({ username: data.username, email: data.email, password_hash, role: data.role });
// }

// // ── Login ─────────────────────────────────────────────────────────────────────
// export async function loginUser(
//   data: LoginInput,
//   ip?: string
// ): Promise<{ user: SafeUserRow; token: string }> {
//   const user = await findUserByUsername(data.username);

//   if (!user) {
//     logSecurity({ event: 'login_attempt', success: false, reason: 'user_not_found', ip });
//     // Use constant-time comparison to prevent user enumeration
//     await bcrypt.compare(data.password, '$2b$12$invalidhashinvalidhashinvalidhas');
//     throw new UnauthorizedError('Invalid username or password');
//   }

//   const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

//   if (!passwordMatch) {
//     logSecurity({ event: 'login_attempt', userId: user.id, success: false, reason: 'wrong_password', ip });
//     throw new UnauthorizedError('Invalid username or password');
//   }

//   logSecurity({ event: 'login_attempt', userId: user.id, success: true, ip });

//   const token = jwt.sign(
//     { id: user.id, username: user.username, role: user.role },
//     config.jwt.secret,
//     { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
//   );

//   const { password_hash: _ph, ...safeUser } = user;
//   return { user: safeUser as SafeUserRow, token };
// }

// // ── Get user profile ──────────────────────────────────────────────────────────
// export async function getUserProfile(id: number): Promise<SafeUserRow> {
//   const user = await findUserById(id);
//   if (!user) throw new NotFoundError('User');
//   return user;
// }

// // ── List users (admin only) ───────────────────────────────────────────────────
// export async function listUsers(
//   q: ListUsersQuery
// ): Promise<{ users: SafeUserRow[]; total: number; skip: number; limit: number; has_next: boolean; has_prev: boolean }> {
//   const { skip, limit } = q;
//   const { users, total } = await findAllUsers(skip, limit);
//   return { users, total, skip, limit, has_next: skip + limit < total, has_prev: skip > 0 };
// }

// // ── Deactivate user ───────────────────────────────────────────────────────────
// export async function deactivateUserById(id: number): Promise<void> {
//   const user = await findUserById(id);
//   if (!user) throw new NotFoundError('User');
//   await deactivateUser(id);
//   logSecurity({ event: 'user_deactivated', userId: id, success: true });
// }