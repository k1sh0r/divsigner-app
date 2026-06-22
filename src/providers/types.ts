export type ProviderId = "openai" | "anthropic" | "custom";

export interface ProviderDef {
  id: ProviderId;
  name: string;
  baseUrl: string;
  keyPrefix: string;
  keyPlaceholder: string;
  format: "openai" | "anthropic";
  defaultModel: string;
  supportsModelsEndpoint: boolean;
  anthropicHeader?: string;
}

export interface ProviderConfig {
  providerId: ProviderId;
  apiKey: string;
  model: string;
  /** Model used for prompt enhancement; falls back to `model` if empty. */
  enhanceModel?: string;
  customBaseUrl?: string;
}

/** A multimodal content part (OpenAI-compatible shape). */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface OpenAICompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // --- Thinking-suppression, routed by upstream model family (see adapter). ---
  // Only one of these is sent per request; gateways forward or ignore unknowns.
  /** OpenAI reasoning models (o-series, gpt-5). */
  reasoning_effort?: "minimal" | "low" | "medium" | "high";
  /** Zhipu GLM: { type: "enabled" | "disabled" }. */
  thinking?: { type: "enabled" | "disabled" };
  /** Qwen3 hybrid-thinking toggle. */
  enable_thinking?: boolean;
  /** Qwen3 reasoning-token cap when thinking is enabled. */
  thinking_budget?: number;
  /** MiniMax M3: route thinking into a separate reasoning channel (reasoning_content)
   *  instead of inline <think> tags in `content`, so it never interleaves with the
   *  HTML stream. Keeps thinking ON — does not disable it. */
  reasoning_split?: boolean;
}

type AnthropicContentPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

export interface AnthropicMessagesRequest {
  model: string;
  messages: { role: "user" | "assistant"; content: AnthropicContentPart[] }[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
}

export interface GenerationResult {
  html: string;
  error?: string;
}
