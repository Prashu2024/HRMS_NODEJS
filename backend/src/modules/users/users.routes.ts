import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  listUsersHandler,
  deactivateUserHandler,
} from './users.controller';
import { authenticate, requireRole } from '../../common/middleware';

const router = Router();

/**
 * POST  /users/register    — Register new user (public OR admin-only in prod)
 * POST  /users/login       — Login and get JWT token
 * GET   /users/me          — Get current user profile (authenticated)
 * GET   /users/            — List all users (admin only)
 * DELETE /users/:id        — Deactivate user (admin only)
 */
router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', authenticate, getMeHandler);
router.get('/', authenticate, requireRole('admin'), listUsersHandler);
router.delete('/:id', authenticate, requireRole('admin'), deactivateUserHandler);

export default router;