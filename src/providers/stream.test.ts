import { describe, it, expect, vi } from "vitest";
import { consumeStream } from "./stream";
import type { StreamError } from "./stream";

/** Build a Response whose body streams the given SSE chunks. */
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream);
}

function openaiContent(text: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

describe("consumeStream truncation handling", () => {
  it("flags an OpenAI 'length' finish on an incomplete document as interrupted", async () => {
    const chunks = [
      openaiContent("<!doctype html><html><body><h1>Hi"),
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "length" }] })}\n\n`,
      "data: [DONE]\n\n",
    ];
    const onText = vi.fn();
    await expect(
      consumeStream(sseResponse(chunks), "openai", { onText }),
    ).rejects.toMatchObject({
      type: "stream_interrupted",
      partialText: expect.stringContaining("<h1>Hi"),
    });
  });

  it("does NOT flag 'length' when the document is already complete", async () => {
    const chunks = [
      openaiContent("<!doctype html><html><body><h1>Hi</h1></body></html>"),
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "length" }] })}\n\n`,
      "data: [DONE]\n\n",
    ];
    const onText = vi.fn();
    const full = await consumeStream(sseResponse(chunks), "openai", { onText });
    expect(full).toContain("</html>");
  });

  it("flags an Anthropic max_tokens stop on an incomplete document", async () => {
    const chunks = [
      `data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "<!doctype html><html><body>partial" } })}\n\n`,
      `data: ${JSON.stringify({ type: "message_delta", delta: { stop_reason: "max_tokens" } })}\n\n`,
    ];
    let captured: StreamError | null = null;
    try {
      await consumeStream(sseResponse(chunks), "anthropic", { onText: vi.fn() });
    } catch (e) {
      captured = e as StreamError;
    }
    expect(captured?.type).toBe("stream_interrupted");
    expect(captured?.partialText).toContain("partial");
  });
});
