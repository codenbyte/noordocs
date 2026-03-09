// ── Safe fetch wrapper with timeout + structured errors ──

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public upstream?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface SafeFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

export async function safeFetch(
  url: string,
  opts: SafeFetchOptions = {},
): Promise<Response> {
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(504, "Upstream request timed out", url);
    }
    throw new ApiError(
      502,
      `Upstream request failed: ${err instanceof Error ? err.message : "unknown"}`,
      url,
    );
  } finally {
    clearTimeout(timer);
  }
}
