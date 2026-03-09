import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { requestId, rateLimit } from "./middleware";
import { ApiError } from "./safeFetch";
import { documentsRouter } from "./documents";

const app = express();

// ── CORS ────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  }),
);

// ── Body parsing ────────────────────────────────────────
app.use(express.json({ limit: "100kb" }));

// ── Middleware ───────────────────────────────────────────
app.use(requestId);
app.use(rateLimit);

// ── Routes ──────────────────────────────────────────────
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/documents", documentsRouter);

// ── 404 handler ─────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const reqId = req.headers["x-request-id"] || "unknown";

  if (err instanceof ApiError) {
    console.error(`[${reqId}] ApiError ${err.statusCode}: ${err.message}`);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(`[${reqId}] Unhandled error:`, err.message);
  res.status(500).json({ error: "Internal server error" });
});

export { app };
