import type { ViteDevServer } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  fetchWithRedirectGuard,
  isTargetAllowed,
} from "./src/providers/relayHosts";

function relayPlugin() {
  return {
    name: "relay-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/relay", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Authorization, Content-Type, anthropic-dangerous-direct-browser-access, anthropic-version, x-api-key",
          );
          res.setHeader("Access-Control-Max-Age", "86400");
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url!, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing url parameter" }));
          return;
        }

        // Dev runs on the developer's own machine, so private/localhost
        // targets (e.g. a local Ollama server) are allowed here.
        const check = isTargetAllowed(targetUrl, { allowPrivate: true });
        if (!check.ok) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = check.reason === "Invalid target URL" ? 400 : 403;
          res.end(JSON.stringify({ error: check.reason }));
          return;
        }

        try {
          const forwardHeaders: Record<string, string> = {};
          const auth = req.headers["authorization"];
          if (typeof auth === "string") forwardHeaders["authorization"] = auth;

          const apiKey = req.headers["x-api-key"];
          if (typeof apiKey === "string") forwardHeaders["x-api-key"] = apiKey;

          const contentType = req.headers["content-type"];
          if (typeof contentType === "string")
            forwardHeaders["content-type"] = contentType;

          const anthHeader =
            req.headers["anthropic-dangerous-direct-browser-access"];
          if (typeof anthHeader === "string")
            forwardHeaders["anthropic-dangerous-direct-browser-access"] =
              anthHeader;

          const anthVersion = req.headers["anthropic-version"];
          if (typeof anthVersion === "string")
            forwardHeaders["anthropic-version"] = anthVersion;

          const bodyChunks: Buffer[] = [];
          for await (const chunk of req) {
            bodyChunks.push(Buffer.from(chunk));
          }
          const body = Buffer.concat(bodyChunks);

          const upstream = await fetchWithRedirectGuard(
            targetUrl,
            {
              method: req.method ?? "GET",
              headers: forwardHeaders,
              body: body.length > 0 ? body : undefined,
            },
            { allowPrivate: true },
          );

          res.statusCode = upstream.status;
          // Forward the SSE content-type so the client uses streaming parsing.
          res.setHeader(
            "Content-Type",
            upstream.headers.get("content-type") ?? "application/json",
          );
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          // Flush headers immediately so the client gets the response status
          // and starts reading the body without waiting for the first chunk.
          // (Node buffers headers until the first byte is written otherwise.)
          (res as any).flushHeaders?.();

          if (upstream.body) {
            const reader = upstream.body.getReader();
            const pump = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  res.end();
                  return;
                }
                // Honor backpressure: if the internal buffer is full, wait
                // for 'drain' before writing more. Without this, large
                // HTML payloads can balloon memory in the dev server.
                if (!res.write(Buffer.from(value))) {
                  await new Promise<void>((resolve) =>
                    res.once("drain", resolve),
                  );
                }
              }
            };
            await pump();
          } else {
            res.end();
          }
        } catch (err) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Relay error",
            }),
          );
        }
      });
    },
  };
}

function scrapePlugin() {
  return {
    name: "scrape-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/scrape", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader("Access-Control-Max-Age", "86400");
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url!, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get("url");

        if (!targetUrl) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing url parameter" }));
          return;
        }

        try {
          const upstream = await fetch(targetUrl, {
            method: "GET",
            headers: { "User-Agent": "Divsigner/1.0" },
          });

          res.statusCode = upstream.status;
          res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "text/html");
          res.setHeader("Access-Control-Allow-Origin", "*");

          if (upstream.body) {
            const reader = upstream.body.getReader();
            const pump = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) { res.end(); return; }
                res.write(Buffer.from(value));
              }
            };
            await pump();
          } else {
            res.end();
          }
        } catch (err) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 502;
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Scrape error" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), scrapePlugin(), relayPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
  },
});