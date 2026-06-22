import type { ProviderDef, ProviderId, ProviderConfig } from "./types";

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    format: "openai",
    defaultModel: "gpt-4o",
    supportsModelsEndpoint: true,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
    format: "anthropic",
    defaultModel: "claude-sonnet-4-20250514",
    supportsModelsEndpoint: false,
    anthropicHeader: "anthropic-dangerous-direct-browser-access: true",
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "",
    keyPrefix: "",
    keyPlaceholder: "Your API key",
    format: "openai",
    defaultModel: "",
    supportsModelsEndpoint: true,
  },
};

export function getProviderDef(id: ProviderId): ProviderDef {
  return PROVIDERS[id];
}

export function getCompletionUrl(config: ProviderConfig): string {
  const def = PROVIDERS[config.providerId];
  const base =
    config.providerId === "custom" && config.customBaseUrl
      ? config.customBaseUrl
      : def.baseUrl;
  return def.format === "anthropic"
    ? `${base}/messages`
    : `${base}/chat/completions`;
}

export function getModelsUrl(config: ProviderConfig): string | null {
  const def = PROVIDERS[config.providerId];
  if (!def.supportsModelsEndpoint) return null;
  const base =
    config.providerId === "custom" && config.customBaseUrl
      ? config.customBaseUrl
      : def.baseUrl;
  return `${base}/models`;
}