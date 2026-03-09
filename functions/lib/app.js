"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./middleware");
const safeFetch_1 = require("./safeFetch");
const documents_1 = require("./documents");
const app = (0, express_1.default)();
exports.app = app;
// ── CORS ────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
}));
// ── Body parsing ────────────────────────────────────────
app.use(express_1.default.json({ limit: "100kb" }));
// ── Middleware ───────────────────────────────────────────
app.use(middleware_1.requestId);
app.use(middleware_1.rateLimit);
// ── Routes ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});
app.use("/api/documents", documents_1.documentsRouter);
// ── 404 handler ─────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
// ── Global error handler ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, _next) => {
    const reqId = req.headers["x-request-id"] || "unknown";
    if (err instanceof safeFetch_1.ApiError) {
        console.error(`[${reqId}] ApiError ${err.statusCode}: ${err.message}`);
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    console.error(`[${reqId}] Unhandled error:`, err.message);
    res.status(500).json({ error: "Internal server error" });
});
//# sourceMappingURL=app.js.map