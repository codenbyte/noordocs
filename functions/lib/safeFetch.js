"use strict";
// ── Safe fetch wrapper with timeout + structured errors ──
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.safeFetch = safeFetch;
class ApiError extends Error {
    statusCode;
    upstream;
    constructor(statusCode, message, upstream) {
        super(message);
        this.statusCode = statusCode;
        this.upstream = upstream;
        this.name = "ApiError";
    }
}
exports.ApiError = ApiError;
async function safeFetch(url, opts = {}) {
    const { method = "GET", headers, body, timeoutMs = 10_000 } = opts;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
        });
        return res;
    }
    catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            throw new ApiError(504, "Upstream request timed out", url);
        }
        throw new ApiError(502, `Upstream request failed: ${err instanceof Error ? err.message : "unknown"}`, url);
    }
    finally {
        clearTimeout(timer);
    }
}
//# sourceMappingURL=safeFetch.js.map