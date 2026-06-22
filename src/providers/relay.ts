import type { ProviderId } from "./types";

const RELAY_BASE = "/api/relay";

export function needsRelay(_providerId: ProviderId): boolean {
  // All providers need relay when called from the browser due to CORS
  return true;
}

export async function relayFetch(
  targetUrl: string,
  apiKey: string,
  init: RequestInit = {},
): Promise<Response> {
  const relayUrl = `${RELAY_BASE}?url=${encodeURIComponent(targetUrl)}`;
  const headers = new Headers(
    (init.headers as Record<string, string>) ?? {},
  );
  headers.set("Authorization", `Bearer ${apiKey}`);

  return fetch(relayUrl, {
    ...init,
    headers,
  });
}