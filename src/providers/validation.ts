import type { ProviderConfig } from "./types";
import { getModelsUrl, PROVIDERS } from "./config";
import { needsRelay, relayFetch } from "./relay";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  skipped?: boolean;
  models?: string[];
}

export async function validateApiKey(
  config: ProviderConfig,
): Promise<ValidationResult> {
  const def = PROVIDERS[config.providerId];

  if (!def.supportsModelsEndpoint) {
    return { valid: true, skipped: true };
  }

  const modelsUrl = getModelsUrl(config);
  if (!modelsUrl) return { valid: true, skipped: true };

  try {
    const doFetch = needsRelay(config.providerId)
      ? (url: string, init: RequestInit) =>
          relayFetch(url, config.apiKey, init)
      : (url: string, init: RequestInit) => fetch(url, init);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
    };

    const response = await doFetch(modelsUrl, { headers });

    if (!response.ok) {
      return {
        valid: false,
        error: `${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const models: string[] = (data.data ?? []).map(
      (m: { id: string }) => m.id,
    );

    return { valid: true, models };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}