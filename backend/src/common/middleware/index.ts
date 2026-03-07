import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { AppError, UnauthorizedError } from '../errors';
import { logRequest } from '../logger';

// ── Request timing + structured logging ──────────────────────────────────────
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const authReq = req as AuthenticatedRequest;

  res.on('finish', () => {
    logRequest({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip ?? (req.socket?.remoteAddress),
      userId: authReq.user?.id?.toString(),
    });
  });

  next();
}

// ── Global error handler ──────────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Unexpected / unhandled errors
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(config.server.nodeEnv === 'development' && {
      detail: err.message,
      stack: err.stack,
    }),
  });
}

// ── 404 handler ───────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// ── JWT Auth types & middleware ───────────────────────────────────────────────
export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Extend Express Request to carry authenticated user
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Require a specific role (call after authenticate) */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    next();
  };
}