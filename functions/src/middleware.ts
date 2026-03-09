import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

// ── Request ID middleware ────────────────────────────────
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers["x-request-id"] as string) || randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("x-request-id", id);
  next();
}

// ── In-memory rate limiter ──────────────────────────────
// NOTE: This is per-instance. For multi-instance deployments
// (Cloud Functions scaling), use Redis / Memorystore instead.
const ipHits = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_PER_MINUTE = parseInt(
  process.env.RATE_LIMIT_PER_MINUTE || "60",
  10,
);

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const key = typeof ip === "string" ? ip : String(ip);
  const now = Date.now();

  let entry = ipHits.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    ipHits.set(key, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_PER_MINUTE) {
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      retryAfterMs: entry.resetAt - now,
    });
    return;
  }

  next();
}

// Periodically clean up stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipHits) {
    if (now > entry.resetAt) ipHits.delete(key);
  }
}, 5 * 60_000);
