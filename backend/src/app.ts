import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ZodError } from 'zod';

import { config } from './config';

import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  apiRateLimiter,
  loginRateLimiter
} from './common/middleware';

import { employeeRoutes } from './modules/employees';
import { attendanceRoutes } from './modules/attendance';
import { userRoutes } from './modules/users';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || config.cors.origins.includes(origin) || !config.server.isProduction) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', apiRateLimiter);
app.use('/api/v1/users/login', loginRateLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health check (no auth) ────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'HRMS Lite API is running', version: '1.0.0' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendances', attendanceRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler (must be last, 4 params) ─────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

  if (err instanceof ZodError) {
    res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  errorHandler(err, req, res, next);

});

export default app;


// import express, { Request, Response, NextFunction } from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import { ZodError } from 'zod';

// import { config } from './config';
// import { requestLogger, errorHandler, notFoundHandler } from './common/middleware';
// import { employeeRoutes } from './modules/employees';
// import { attendanceRoutes } from './modules/attendance';
// import { userRoutes } from './modules/users';

// const app = express();

// // ── Security headers ──────────────────────────────────────────────────────────
// app.use(helmet());
// app.set('trust proxy', 1);

// // ── CORS ──────────────────────────────────────────────────────────────────────
// app.use(
//   cors({
//     origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//       if (!origin || config.cors.origins.includes(origin) || !config.server.isProduction) {
//         return callback(null, true);
//       }
//       callback(new Error(`Origin ${origin} not allowed by CORS`));
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );

// // ── Rate limiting ─────────────────────────────────────────────────────────────
// app.use(
//   '/api/',
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: { status: 'error', message: 'Too many requests, please try again later' },
//   })
// );

// app.use(
//   '/api/v1/users/login',
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 20,
//     message: { status: 'error', message: 'Too many login attempts, please try again later' },
//   })
// );

// // ── Body parsing ──────────────────────────────────────────────────────────────
// app.use(express.json({ limit: '1mb' }));
// app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// // ── Request logging ───────────────────────────────────────────────────────────
// app.use(requestLogger);

// // ── Health check (no auth) ────────────────────────────────────────────────────
// app.get('/', (_req: Request, res: Response) => {
//   res.json({ message: 'HRMS Lite API is running', version: '1.0.0' });
// });

// app.get('/health', (_req: Request, res: Response) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// // ── API Routes ────────────────────────────────────────────────────────────────
// app.use('/api/v1/users',       userRoutes);
// app.use('/api/v1/employees',   employeeRoutes);
// app.use('/api/v1/attendances', attendanceRoutes);

// // ── 404 handler ───────────────────────────────────────────────────────────────
// app.use(notFoundHandler);

// // ── Global error handler (must be last, 4 params) ─────────────────────────────
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   if (err instanceof ZodError) {
//     res.status(422).json({
//       status: 'error',
//       message: 'Validation failed',
//       errors: err.errors.map((e) => ({
//         field: e.path.join('.'),
//         message: e.message,
//       })),
//     });
//     return;
//   }
//   errorHandler(err, req, res, next);
// });

// export default app;