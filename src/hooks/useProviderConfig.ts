import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { ProviderConfig } from "../providers/types";
import { PROVIDERS } from "../providers/config";
import { validateApiKey } from "../providers/validation";
import type { ValidationResult } from "../providers/validation";

const STORAGE_KEY = "divsigner-provider-config";

const DEFAULT_CONFIG: ProviderConfig = {
  providerId: "openai",
  apiKey: "",
  model: PROVIDERS.openai.defaultModel,
  enhanceModel: "",
};

export function useProviderConfig() {
  const [config, setConfig] = useLocalStorage<ProviderConfig>(
    STORAGE_KEY,
    DEFAULT_CONFIG,
  );

  const updateConfig = useCallback(
    (partial: Partial<ProviderConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        if (partial.providerId && partial.providerId !== prev.providerId) {
          next.model = PROVIDERS[partial.providerId].defaultModel;
          next.enhanceModel = "";
        }
        return next;
      });
    },
    [setConfig],
  );

  const getEnhanceModel = useCallback(() => {
    return config.enhanceModel?.trim() || config.model;
  }, [config.enhanceModel, config.model]);

  const validate = useCallback(async (): Promise<ValidationResult> => {
    return validateApiKey(config);
  }, [config]);

  const clearConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, [setConfig]);

  return { config, updateConfig, validate, clearConfig, getEnhanceModel };
}