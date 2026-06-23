import { useEffect, useState } from "react";
import { PROVIDERS } from "../providers/config";
import { validateApiKey, type ValidationResult } from "../providers/validation";
import type { ProviderConfig } from "../providers/types";

export interface ModelListState {
  models: string[];
  loading: boolean;
  /** false for providers with no /models endpoint (e.g. Anthropic). */
  supportsEndpoint: boolean;
  /** Last validation result (for status display in Settings). */
  result: ValidationResult | null;
}

/**
 * Shared model-list fetch + fallback. Used by SettingsPanel and the prompt-bar
 * model dropdown so both call sites share one fetch.
 *
 * Runs `validateApiKey(config)` in an effect keyed on apiKey/providerId/
 * customBaseUrl/supportsModelsEndpoint. Skips (returns supportsEndpoint:false)
 * when there is no key or the provider has no /models endpoint.
 */
export function useModelList(config: ProviderConfig): ModelListState {
  const def = PROVIDERS[config.providerId];
  const supportsEndpoint = Boolean(def?.supportsModelsEndpoint);

  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (!config.apiKey || !supportsEndpoint) {
      setModels([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Debounced so editing the key field doesn't fire a request per keystroke.
    const timer = setTimeout(() => {
      setLoading(true);
      validateApiKey(config)
        .then((res) => {
          if (cancelled) return;
          setResult(res);
          if (res.models) setModels(res.models);
        })
        .catch(() => {
          /* leave as manual input */
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiKey, config.providerId, config.customBaseUrl, supportsEndpoint]);

  return { models, loading, supportsEndpoint, result };
}