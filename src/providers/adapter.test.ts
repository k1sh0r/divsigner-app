import { describe, it, expect } from "vitest";
import {
  buildRequestBody,
  getRecommendedMaxTokens,
  getModelMaxTokens,
  isReasoningModel,
} from "./adapter";
import type { ProviderConfig, ChatMessage } from "./types";

const messages: ChatMessage[] = [
  { role: "system", content: "sys" },
  { role: "user", content: "make a poster" },
];

function cfg(overrides: Partial<ProviderConfig>): ProviderConfig {
  return {
    providerId: "custom",
    apiKey: "k",
    model: "glm-4.7",
    ...overrides,
  };
}

describe("getRecommendedMaxTokens", () => {
  it("uses the model's FULL cap, not a throttled fraction", () => {
    // Regression: this used to return floor(cap * 0.75), truncating posters.
    expect(getRecommendedMaxTokens("glm-4.7")).toBe(getModelMaxTokens("glm-4.7"));
    expect(getRecommendedMaxTokens("glm-4.7")).toBe(16384);
  });

  it("falls back to the default cap for unknown models", () => {
    expect(getRecommendedMaxTokens("totally-unknown-model")).toBe(8192);
  });
});

describe("isReasoningModel", () => {
  it("matches reasoning families that need a bounded thinking budget", () => {
    for (const m of [
      "glm-4.6",
      "glm-5.1",
      "deepseek-v3.2",
      "deepseek-r1",
      "qwen3-235b",
      "o3-mini",
      "gpt-5",
      "my-relay-thinking-model",
    ]) {
      expect(isReasoningModel(m)).toBe(true);
    }
  });

  it("leaves non-reasoning / unknown models untouched", () => {
    for (const m of ["gpt-4o", "kimi-k2.5", "deepseek-v3", "some-custom-llm"]) {
      expect(isReasoningModel(m)).toBe(false);
    }
  });
});

describe("buildRequestBody — family-routed thinking suppression", () => {
  it("disables GLM thinking via its native field (not reasoning_effort)", () => {
    const body = buildRequestBody(cfg({ model: "GLM-4.7" }), messages, true) as any;
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body.reasoning_effort).toBeUndefined();
    expect(body.max_tokens).toBe(16384);
  });

  it("bounds Qwen3 thinking with a token budget", () => {
    const body = buildRequestBody(cfg({ model: "qwen3-235b" }), messages, true) as any;
    expect(body.enable_thinking).toBe(true);
    expect(body.thinking_budget).toBe(1024);
  });

  it("uses reasoning_effort only for genuine OpenAI reasoning models", () => {
    const body = buildRequestBody(cfg({ model: "o3-mini" }), messages, true) as any;
    expect(body.reasoning_effort).toBe("low");
    expect(body.thinking).toBeUndefined();
  });

  it("sends no thinking field for non-reasoning / unknown models", () => {
    const body = buildRequestBody(cfg({ model: "kimi-k2.5" }), messages, true) as any;
    expect(body.thinking).toBeUndefined();
    expect(body.enable_thinking).toBeUndefined();
    expect(body.reasoning_effort).toBeUndefined();
  });

  it("keeps MiniMax M3 thinking ON but splits it out of the content stream", () => {
    const body = buildRequestBody(cfg({ model: "MiniMax-M3" }), messages, true) as any;
    // Thinking is NOT disabled — it is routed to a separate reasoning channel.
    expect(body.reasoning_split).toBe(true);
    expect(body.thinking).toBeUndefined();
  });

  it("gives interleaved MiniMax models extra token headroom (not the 8192 default)", () => {
    expect(getRecommendedMaxTokens("MiniMax-M3")).toBe(32768);
    expect(getRecommendedMaxTokens("minimax-m2")).toBe(32768);
  });

  it("anthropic format carries the full token cap and no openai thinking fields", () => {
    const body = buildRequestBody(
      cfg({ providerId: "anthropic", model: "claude-sonnet-4-20250514" }),
      messages,
      true,
    ) as any;
    expect(body.max_tokens).toBe(8192);
    expect(body.thinking).toBeUndefined();
    expect(body.reasoning_effort).toBeUndefined();
  });
});
