import type {
  ProviderConfig,
  ChatMessage,
  ContentPart,
  OpenAICompletionRequest,
  AnthropicMessagesRequest,
} from "./types";
import { PROVIDERS } from "./config";

// Model-specific token limits — prevents requesting too many tokens
// which slows generation and increases interruption risk.
export interface ModelTokenLimits {
  maxTokens: number;
  contextWindow: number;
  recommendedOutput: number;
}

// Per-model token limits (verified 2025)
export const MODEL_TOKEN_LIMITS: Record<string, ModelTokenLimits> = {
  // GLM models (Zhipu)
  "glm-4.7": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "GLM-4.7": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "glm-5.1": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "GLM-5.1": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "GLM-5": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },

  // Kimi models (Moonshot)
  "kimi-k2.5": { maxTokens: 16384, contextWindow: 256000, recommendedOutput: 8192 },
  "kimi-k2.6": { maxTokens: 16384, contextWindow: 256000, recommendedOutput: 8192 },
  "Kimi-K2.5": { maxTokens: 16384, contextWindow: 256000, recommendedOutput: 8192 },
  "Kimi-K2.6": { maxTokens: 16384, contextWindow: 256000, recommendedOutput: 8192 },
  "Kimi-K2.5-0805": { maxTokens: 8192, contextWindow: 256000, recommendedOutput: 4096 },

  // DeepSeek models
  "deepseek-v3": { maxTokens: 8192, contextWindow: 64000, recommendedOutput: 4096 },
  "deepseek-v3.2": { maxTokens: 8192, contextWindow: 64000, recommendedOutput: 4096 },
  "DeepSeek-V3": { maxTokens: 8192, contextWindow: 64000, recommendedOutput: 4096 },
  "DeepSeek-V3.2": { maxTokens: 8192, contextWindow: 64000, recommendedOutput: 4096 },

  // Qwen models
  "qwen3-coder-480b": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "qwen3-235b": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },
  "Qwen3-Coder-480B": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 8192 },

  // OpenAI models
  "gpt-4o": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 4096 },
  "gpt-4o-mini": { maxTokens: 16384, contextWindow: 128000, recommendedOutput: 4096 },

  // Anthropic models
  "claude-sonnet-4-20250514": { maxTokens: 8192, contextWindow: 200000, recommendedOutput: 4096 },
  "claude-opus-4-20250514": { maxTokens: 8192, contextWindow: 200000, recommendedOutput: 4096 },

  // Fallback default
  _default: { maxTokens: 8192, contextWindow: 128000, recommendedOutput: 4096 },
};

/** Determine max output tokens for a model name.
 * Falls back to 8192 (safer default) if unknown.  */
export function getModelMaxTokens(model: string): number {
  if (MODEL_TOKEN_LIMITS[model]) return MODEL_TOKEN_LIMITS[model].maxTokens;

  // Case-insensitive search
  const lower = model.toLowerCase();
  for (const [key, lim] of Object.entries(MODEL_TOKEN_LIMITS)) {
    if (key !== "_default" && key.toLowerCase() === lower) return lim.maxTokens;
  }

  // Partial match — e.g. "glm-5" substring
  for (const [key, lim] of Object.entries(MODEL_TOKEN_LIMITS)) {
    if (key !== "_default" && (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower))) {
      return lim.maxTokens;
    }
  }

  return (MODEL_TOKEN_LIMITS as any)._default.maxTokens as number;
}

/** Max output tokens for HTML generation (heavier output).
 *
 * Use the model's FULL cap, not a fraction of it. A poster document with inline
 * CSS is large, and reasoning models spend part of the budget thinking before
 * emitting HTML — under-provisioning `max_tokens` is the primary cause of
 * truncated, "incomplete" posters. The early-termination in `consumeStream`
 * already stops the stream the moment `</html>` arrives, so a generous cap
 * costs nothing on well-behaved output and only helps the heavy cases. */
export function getRecommendedMaxTokens(model: string): number {
  return getModelMaxTokens(model);
}

/** True for model families that run an internal chain-of-thought controlled by
 *  API parameters (not by prompt text). For these we send `reasoning_effort`
 *  to BOUND the thinking — otherwise it can consume the entire output budget
 *  (truncating the HTML) or stream indefinitely ("keeps thinking more and
 *  more"). Unknown / custom model names match nothing here, so they are left
 *  untouched and never risk a spurious "unsupported parameter" rejection. */
export function isReasoningModel(model: string): boolean {
  const m = model.toLowerCase();
  return (
    /\bo[1-9]\b/.test(m) || // OpenAI o-series (o1, o3, o4…)
    /gpt-5/.test(m) ||
    /glm-(?:4\.[5-9]|[5-9])/.test(m) || // GLM 4.5+ have a thinking mode
    /glm-z/.test(m) || // GLM-Z reasoning line
    /deepseek-(?:r\d|v3\.[2-9]|v[4-9])/.test(m) || // R-series + V3.2+ thinking
    /qwen3/.test(m) || // Qwen3 hybrid thinking
    /thinking|reasoner|reasoning/.test(m)
  );
}

/** Thinking-suppression fields for an OpenAI-compatible request body, routed by
 *  upstream model FAMILY. There is no single standard field — each backend uses
 *  its own. A gateway that forwards unknown body fields (the common case) will
 *  pass these to the upstream; one that strips them simply ignores them. Either
 *  way the request stays valid, because we only emit a family's NATIVE field.
 *
 *  This supersedes the earlier blanket `reasoning_effort`, which is OpenAI-only
 *  and is meaningless to a GLM/Qwen backend — hence "still thinking a lot". */
export function reasoningControls(
  model: string,
): Partial<OpenAICompletionRequest> {
  const m = model.toLowerCase();

  // GLM (Zhipu): thinking is binary (on/off), no token budget. Disable it so a
  // reasoning pass can't consume the output budget or stall the stream.
  if (/glm/.test(m)) return { thinking: { type: "disabled" } };

  // Qwen3: supports a real bound — keep a little reasoning, capped hard.
  if (/qwen3/.test(m)) return { enable_thinking: true, thinking_budget: 1024 };

  // OpenAI reasoning models: the only valid lever is reasoning_effort.
  if (/\bo[1-9]\b/.test(m) || /gpt-5/.test(m)) return { reasoning_effort: "low" };

  // DeepSeek-reasoner can't be bounded; deepseek-chat doesn't think. Others
  // (Kimi, MiniMax, unknown/custom) get nothing — no field, no rejection risk.
  return {};
}

/** Parse a data URL into Anthropic's base64 image source shape. */
function dataUrlToAnthropicImage(url: string) {
  const match = url.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: match[1]!,
      data: match[2]!,
    },
  };
}

function toAnthropicContent(content: string | ContentPart[]) {
  if (typeof content === "string") {
    return [{ type: "text" as const, text: content }];
  }
  return content
    .map((part) => {
      if (part.type === "text") return { type: "text" as const, text: part.text };
      return dataUrlToAnthropicImage(part.image_url.url);
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

export function buildRequestBody(
  config: ProviderConfig,
  messages: ChatMessage[],
  stream = false,
): OpenAICompletionRequest | AnthropicMessagesRequest {
  const def = PROVIDERS[config.providerId];

  if (def.format === "anthropic") {
    const systemMsg = messages.find((m) => m.role === "system");
    const systemText =
      typeof systemMsg?.content === "string" ? systemMsg.content : undefined;
    const nonSystem = messages.filter((m) => m.role !== "system");
    return {
      model: config.model,
      system: systemText,
      messages: nonSystem.map((m) => ({
        role: m.role as "user" | "assistant",
        content: toAnthropicContent(m.content),
      })),
      max_tokens: getRecommendedMaxTokens(config.model),
      temperature: 0.7,
      stream,
    };
  }

  return {
    model: config.model,
    messages,
    temperature: 0.7,
    max_tokens: getRecommendedMaxTokens(config.model),
    stream,
    ...reasoningControls(config.model),
  };
}
