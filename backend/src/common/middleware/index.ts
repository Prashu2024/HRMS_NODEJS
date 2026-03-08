import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { AppError, UnauthorizedError } from '../errors';
import { logRequest } from '../logger';

import rateLimit from 'express-rate-limit';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';


// ───────────────────────────────────────────────────────────────
// Request timing + structured logging
// ───────────────────────────────────────────────────────────────
export function requestLogger(req: Request, res: Response, next: NextFunction): void {

  const start = Date.now();
  const authReq = req as AuthenticatedRequest;

  res.on('finish', () => {

    logRequest({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip ?? req.socket?.remoteAddress,
      userId: authReq.user?.id?.toString(),
    });

  });

  next();
}


// ───────────────────────────────────────────────────────────────
// Rate Limiters
// ───────────────────────────────────────────────────────────────

// Local limiter (development)
const localApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later',
  },
});

const localLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later',
  },
});


// Production limiter (Redis)
let redisApiLimiter: Ratelimit | null = null;
let redisLoginLimiter: Ratelimit | null = null;

if (config.server.isProduction) {

  const redis = Redis.fromEnv();

  redisApiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '15 m'),
  });

  redisLoginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '15 m'),
  });

}


// API rate limiter
export async function apiRateLimiter(req: Request, res: Response, next: NextFunction) {

  if (!config.server.isProduction) {
    return localApiLimiter(req, res, next);
  }

  try {

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'anonymous';

    const { success } = await redisApiLimiter!.limit(ip);

    if (!success) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later',
      });
    }

    next();

  } catch {
    next();
  }
}


// Login limiter
export async function loginRateLimiter(req: Request, res: Response, next: NextFunction) {

  if (!config.server.isProduction) {
    return localLoginLimiter(req, res, next);
  }

  try {

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'anonymous';

    const { success } = await redisLoginLimiter!.limit(ip);

    if (!success) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many login attempts, please try again later',
      });
    }

    next();

  } catch {
    next();
  }
}


// ───────────────────────────────────────────────────────────────
// Global error handler
// ───────────────────────────────────────────────────────────────
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

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(config.server.nodeEnv === 'development' && {
      detail: err.message,
      stack: err.stack,
    }),
  });

}


// ───────────────────────────────────────────────────────────────
// 404 handler
// ───────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {

  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });

}


// ───────────────────────────────────────────────────────────────
// JWT Auth types & middleware
// ───────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

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


export function requireRole(...roles: string[]) {

  return (req: Request, _res: Response, next: NextFunction): void => {

    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();

  };

}


// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { config } from '../../config/index';
// import { AppError, UnauthorizedError } from '../errors';
// import { logRequest } from '../logger';

// // ── Request timing + structured logging ──────────────────────────────────────
// export function requestLogger(req: Request, res: Response, next: NextFunction): void {
//   const start = Date.now();
//   const authReq = req as AuthenticatedRequest;

//   res.on('finish', () => {
//     logRequest({
//       method: req.method,
//       url: req.originalUrl,
//       statusCode: res.statusCode,
//       durationMs: Date.now() - start,
//       ip: req.ip ?? (req.socket?.remoteAddress),
//       userId: authReq.user?.id?.toString(),
//     });
//   });

//   next();
// }

// // ── Global error handler ──────────────────────────────────────────────────────
// export function errorHandler(
//   err: Error,
//   _req: Request,
//   res: Response,
//   _next: NextFunction
// ): void {
//   if (err instanceof AppError) {
//     res.status(err.statusCode).json({
//       status: 'error',
//       message: err.message,
//       ...(config.server.nodeEnv === 'development' && { stack: err.stack }),
//     });
//     return;
//   }

//   // Unexpected / unhandled errors
//   res.status(500).json({
//     status: 'error',
//     message: 'Internal server error',
//     ...(config.server.nodeEnv === 'development' && {
//       detail: err.message,
//       stack: err.stack,
//     }),
//   });
// }

// // ── 404 handler ───────────────────────────────────────────────────────────────
// export function notFoundHandler(req: Request, res: Response): void {
//   res.status(404).json({
//     status: 'error',
//     message: `Route ${req.method} ${req.originalUrl} not found`,
//   });
// }

// // ── JWT Auth types & middleware ───────────────────────────────────────────────
// export interface JwtPayload {
//   id: number;
//   username: string;
//   role: string;
// }

// // Extend Express Request to carry authenticated user
// export interface AuthenticatedRequest extends Request {
//   user?: JwtPayload;
// }

// export function authenticate(
//   req: Request,
//   _res: Response,
//   next: NextFunction
// ): void {
//   const authHeader = req.headers['authorization'] as string | undefined;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return next(new UnauthorizedError('No token provided'));
//   }

//   const token = authHeader.slice(7);
//   try {
//     const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
//     (req as AuthenticatedRequest).user = payload;
//     next();
//   } catch {
//     next(new UnauthorizedError('Invalid or expired token'));
//   }
// }

// /** Require a specific role (call after authenticate) */
// export function requireRole(...roles: string[]) {
//   return (req: Request, _res: Response, next: NextFunction): void => {
//     const user = (req as AuthenticatedRequest).user;
//     if (!user || !roles.includes(user.role)) {
//       return next(new UnauthorizedError('Insufficient permissions'));
//     }
//     next();
//   };
// }