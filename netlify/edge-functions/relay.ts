const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const RETRY_STATUSES = new Set([429, 502, 503, 504]);
// Long-running HTML generation can take 1–2 minutes for thinking models
// (GLM, Kimi, DeepSeek) where the first byte arrives only after the
// reasoning phase. 45 s used to be enough but routinely aborted these
// streams, surfacing as a "stream interrupted" error in the app.
const UPSTREAM_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

export const config = {
  runtime: "edge",
};

async function fetchWithRetry(
  targetUrl: string,
  options: RequestInit,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let controller: AbortController | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), UPSTREAM_TIMEOUT_MS);

      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId!);
      timeoutId = null;

      if (!RETRY_STATUSES.has(response.status) || attempt === MAX_RETRIES) {
        return response;
      }

      // Don't retry streaming responses — pass them through to the client
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream")) {
        return response;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error("Relay failed after retries");
}

export default async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get("origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0]!,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, anthropic-dangerous-direct-browser-access, anthropic-version, x-api-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const allowedHosts = [
    "api.anthropic.com",
    "api.openai.com",
  ];
  const targetHost = new URL(targetUrl).hostname;
  if (
    !allowedHosts.some(
      (h) => targetHost === h || targetHost.endsWith(`.${h}`),
    )
  ) {
    return new Response(
      JSON.stringify({ error: "Target URL not allowed" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const forwardHeaders = new Headers();
    const authHeader = request.headers.get("authorization");
    if (authHeader) forwardHeaders.set("authorization", authHeader);

    const apiKeyHeader = request.headers.get("x-api-key");
    if (apiKeyHeader) forwardHeaders.set("x-api-key", apiKeyHeader);

    const contentType = request.headers.get("content-type");
    if (contentType) forwardHeaders.set("content-type", contentType);

    const anthropicHeader = request.headers.get(
      "anthropic-dangerous-direct-browser-access",
    );
    if (anthropicHeader)
      forwardHeaders.set(
        "anthropic-dangerous-direct-browser-access",
        anthropicHeader,
      );
    const anthropicVersion = request.headers.get("anthropic-version");
    if (anthropicVersion)
      forwardHeaders.set("anthropic-version", anthropicVersion);

    const body =
      request.method === "POST" ? await request.text() : undefined;

    const response = await fetchWithRetry(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
    });

    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));
    responseHeaders.delete("content-encoding");
    responseHeaders.set("Cache-Control", "no-cache, no-transform");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Relay error",
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}