import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/index';

// ── Ensure log directory exists ───────────────────────────────────────────────
const logDir = path.resolve(process.cwd(), config.logging.dir);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// ── Custom JSON format ────────────────────────────────────────────────────────
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ── Human-readable format for dev console ────────────────────────────────────
const devConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...rest } = info as {
      timestamp: string;
      level: string;
      message: string;
      service?: string;
      [key: string]: unknown;
    };
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
    return `[${timestamp}] ${level} [${service ?? 'app'}]: ${message}${meta}`;
  })
);

// ── Transports ────────────────────────────────────────────────────────────────
const transports: winston.transport[] = [
  new DailyRotateFile({
    filename: path.join(logDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    zippedArchive: true,
    format: jsonFormat,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '90d',
    zippedArchive: true,
    format: jsonFormat,
  }),
  new winston.transports.Console({
    format: config.server.isProduction ? jsonFormat : devConsoleFormat,
  }),
];

// ── Base logger ───────────────────────────────────────────────────────────────
const baseLogger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: 'hrms-lite-api',
    environment: config.server.nodeEnv,
  },
  transports,
  exitOnError: false,
});

// ── Typed helper functions ────────────────────────────────────────────────────

export function logRequest(meta: {
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userId?: string;
}): void {
  baseLogger.info('http_request', { type: 'http', ...meta });
}

export function logSecurity(meta: {
  event: string;
  userId?: string | number;
  ip?: string;
  success: boolean;
  reason?: string;
}): void {
  const level = meta.success ? 'info' : 'warn';
  baseLogger.log(level, 'security_event', { type: 'security', ...meta });
}

export function logDbQuery(meta: {
  operation: string;
  table: string;
  durationMs: number;
  rowCount?: number;
  error?: string;
}): void {
  const level = meta.error ? 'error' : 'debug';
  baseLogger.log(level, 'db_query', { type: 'db', ...meta });
}

export function logLifecycle(event: string, meta?: Record<string, unknown>): void {
  baseLogger.info(event, { type: 'lifecycle', ...meta });
}

export const logger = baseLogger;
export default baseLogger;