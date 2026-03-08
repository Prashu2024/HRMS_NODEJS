import rateLimit from "express-rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Request, Response, NextFunction } from "express";
import { config } from "../../config";

// ── Local limiter (for development) ─────────────────────────────
const localLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please try again later" },
});

const localLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "error", message: "Too many login attempts, please try again later" },
});


// ── Redis limiter (for production / Vercel) ─────────────────────
let redisLimiter: Ratelimit | null = null;
let redisLoginLimiter: Ratelimit | null = null;

if (config.server.isProduction) {
  const redis = Redis.fromEnv();

  redisLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "15 m"),
  });

  redisLoginLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "15 m"),
  });
}


// ── Wrapper middleware ──────────────────────────────────────────
export async function apiRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {

  if (!config.server.isProduction) {
    return localLimiter(req, res, next);
  }

  try {

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "anonymous";

    const { success } = await redisLimiter!.limit(ip);

    if (!success) {
      return res.status(429).json({
        status: "error",
        message: "Too many requests, please try again later",
      });
    }

    next();

  } catch {
    next();
  }
}


export async function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {

  if (!config.server.isProduction) {
    return localLoginLimiter(req, res, next);
  }

  try {

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "anonymous";

    const { success } = await redisLoginLimiter!.limit(ip);

    if (!success) {
      return res.status(429).json({
        status: "error",
        message: "Too many login attempts, please try again later",
      });
    }

    next();

  } catch {
    next();
  }
}