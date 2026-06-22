// Stream audit harness — runs the real stream.ts against a mock SSE server
// to surface the failure modes the user reported ("stream interrupted" in
// the app while CLI works). Not a vitest file so it can live next to the
// provider it audits. Run with: npx tsx scripts/stream-audit.ts
import {
  consumeStream,
  fetchStreamWithRetry,
  shouldRetryStreamError,
  type StreamError,
} from "../src/providers/stream";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function sseResponse(
  events: Array<string | { delayMs: number; data: string }>,
): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      let i = 0;
      const tick = () => {
        if (i >= events.length) {
          controller.close();
          return;
        }
        const e = events[i++]!;
        if (typeof e === "string") {
          controller.enqueue(enc.encode(e));
          queueMicrotask(tick);
        } else {
          setTimeout(() => {
            controller.enqueue(enc.encode(e.data));
            queueMicrotask(tick);
          }, e.delayMs);
        }
      };
      tick();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`  ✗ ${name}`);
    console.log(`      ${e instanceof Error ? e.message : String(e)}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`);
      }
    },
    toContain(sub: string) {
      if (typeof actual !== "string" || !actual.includes(sub)) {
        throw new Error(`expected ${JSON.stringify(actual)} to contain ${JSON.stringify(sub)}`);
      }
    },
  };
}

async function main() {
  console.log("\n— consumeStream —");

  await test("parses OpenAI-format SSE deltas", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"<html>"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"<body>hi</body>"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"</html>"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const text: string[] = [];
    const out = await consumeStream(res, "openai", { onText: (d) => text.push(d) });
    expect(out).toBe("<html><body>hi</body></html>");
    expect(text.join("")).toBe("<html><body>hi</body></html>");
  });

  await test("parses Anthropic content_block_delta", async () => {
    const res = sseResponse([
      'data: {"type":"message_start","message":{}}\n\n',
      'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"<html>x</html>"}}\n\n',
      'data: {"type":"content_block_stop","index":0}\n\n',
      'data: {"type":"message_stop"}\n\n',
    ]);
    const out = await consumeStream(res, "anthropic", { onText: () => {} });
    expect(out).toBe("<html>x</html>");
  });

  await test("decodes UTF-8 split across chunks", async () => {
    const enc = new TextEncoder();
    const sse = `data: {"choices":[{"delta":{"content":"🎨"}}]}\n\ndata: [DONE]\n\n`;
    const buf = enc.encode(sse);
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(buf.slice(0, 10));
        controller.enqueue(buf.slice(10, 20));
        controller.enqueue(buf.slice(20));
        controller.close();
      },
    });
    const res = new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
    const out = await consumeStream(res, "openai", { onText: () => {} });
    expect(out).toBe("🎨");
  });

  await test("detects in-band error and preserves partialText", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"<html>part"}}]}\n\n',
      'data: {"error":{"message":"overloaded"}}\n\n',
    ]);
    let captured: StreamError | null = null;
    try {
      await consumeStream(res, "openai", { onText: () => {} });
    } catch (e) {
      captured = e as StreamError;
    }
    if (!captured) throw new Error("expected throw");
    if (captured.type !== "stream_interrupted") throw new Error(`type=${captured.type}`);
    if (captured.partialText !== "<html>part") throw new Error(`partialText=${captured.partialText}`);
  });

  await test("does NOT false-positive on a class='error-banner' in payload", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"<div class=\\"error-banner\\">"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const out = await consumeStream(res, "openai", { onText: () => {} });
    expect(out).toBe('<div class="error-banner">x');
  });

  console.log("\n— fetchStreamWithRetry —");

  await test("does NOT retry if we have >500 chars already", async () => {
    let calls = 0;
    const big = "<html>" + "x".repeat(600) + "</html>";
    const fetchFn = async () => {
      calls++;
      const enc = new TextEncoder();
      const body = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            enc.encode(`data: {"choices":[{"delta":{"content":"${big}"}}]}\n\n`),
          );
          // small delay so the read() can pick up data before the error
          setTimeout(() => controller.error(new Error("network blip")), 5);
        },
      });
      return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
    };
    let caught: StreamError | null = null;
    try {
      await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 2, baseDelayMs: 1 });
    } catch (e) {
      caught = e as StreamError;
    }
    if (!caught) throw new Error("expected throw");
    if (caught.partialText !== big) throw new Error(`partialText mismatch: ${caught.partialText?.length} chars`);
    if (calls !== 1) throw new Error(`expected 1 call, got ${calls}`);
  });

  await test("DOES retry up to maxRetries when nothing arrived", async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      if (calls < 3) throw new TypeError("Failed to fetch");
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"<html>ok</html>"}}]}\n\n',
        "data: [DONE]\n\n",
      ]);
    };
    const out = await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 2, baseDelayMs: 1 });
    expect(out).toBe("<html>ok</html>");
    if (calls !== 3) throw new Error(`expected 3 calls, got ${calls}`);
  });

  await test("surfaces the final error after all retries exhausted", async () => {
    const fetchFn = async () => {
      throw new Error("connection refused");
    };
    let caught: Error | null = null;
    try {
      await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 1, baseDelayMs: 1 });
    } catch (e) {
      caught = e as Error;
    }
    if (!caught) throw new Error("expected throw");
    if (!caught.message.includes("connection refused")) throw new Error(`message=${caught.message}`);
  });

  await test("retries on TypeError: Failed to fetch (real browser error)", async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      if (calls < 2) throw new TypeError("Failed to fetch");
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"<html>ok</html>"}}]}\n\n',
        "data: [DONE]\n\n",
      ]);
    };
    const out = await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 2, baseDelayMs: 1 });
    expect(out).toBe("<html>ok</html>");
    if (calls !== 2) throw new Error(`expected 2 calls, got ${calls}`);
  });

  await test("retries on 502 from relay (after upstream fetch aborts)", async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      if (calls < 2) throw new Error("502: Bad Gateway");
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"<html>recovered</html>"}}]}\n\n',
        "data: [DONE]\n\n",
      ]);
    };
    const out = await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 2, baseDelayMs: 1 });
    expect(out).toBe("<html>recovered</html>");
  });

  await test("does NOT retry on 401 (client error)", async () => {
    let calls = 0;
    const fetchFn = async () => {
      calls++;
      throw new Error("401: Unauthorized");
    };
    let caught: Error | null = null;
    try {
      await fetchStreamWithRetry(fetchFn, "openai", { onText: () => {} }, { maxRetries: 2, baseDelayMs: 1 });
    } catch (e) {
      caught = e as Error;
    }
    if (calls !== 1) throw new Error(`expected 1 call, got ${calls}`);
    if (!caught?.message.includes("401")) throw new Error(`message=${caught?.message}`);
  });

  console.log("\n— shouldRetryStreamError —");

  const retryCases: [string, Error, boolean][] = [
    ["stream_interrupted", Object.assign(new Error("x"), { type: "stream_interrupted" }), true],
    ["TypeError: Failed to fetch", new TypeError("Failed to fetch"), true],
    ["TypeError: Load failed (Safari)", new TypeError("Load failed"), true],
    ["AbortError", Object.assign(new Error("aborted"), { name: "AbortError" }), true],
    ["502 from relay", new Error("502: Bad Gateway"), true],
    ["503 from relay", new Error("503: Service Unavailable"), true],
    ["504 from relay", new Error("504: Gateway Timeout"), true],
    ["401 (client)", new Error("401: Unauthorized"), false],
    ["403 (client)", new Error("403: Forbidden"), false],
    ["429 (client)", new Error("429: Too Many Requests"), false],
    ["ECONNREFUSED", new Error("connect ECONNREFUSED"), true],
    ["ECONNRESET", new Error("read ECONNRESET"), true],
    ["ENOTFOUND", new Error("getaddrinfo ENOTFOUND"), true],
    ["Plain 'network' message", new Error("network unreachable"), true],
    ["Random error", new Error("something else went wrong"), false],
  ];
  for (const [name, err, expected] of retryCases) {
    await test(`shouldRetryStreamError: ${name} → ${expected}`, () => {
      const got = shouldRetryStreamError(err);
      if (got !== expected) throw new Error(`expected ${expected}, got ${got}`);
    });
  }

  console.log("\n— consumeStream error payload detection —");

  await test("does NOT false-positive on class='error-banner' in content", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"<div class=\\"error-banner\\">ok"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"</div>"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const out = await consumeStream(res, "openai", { onText: () => {} });
    expect(out).toBe('<div class="error-banner">ok</div>');
  });

  await test("does NOT false-positive on an 'error' string in user content", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"Error: file not found - retrying"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    const out = await consumeStream(res, "openai", { onText: () => {} });
    expect(out).toBe("Error: file not found - retrying");
  });

  await test("detects real error object and preserves partialText", async () => {
    const res = sseResponse([
      'data: {"choices":[{"delta":{"content":"<html>half"}}]}\n\n',
      'data: {"error":{"message":"rate limit"}}\n\n',
    ]);
    let caught: StreamError | null = null;
    try {
      await consumeStream(res, "openai", { onText: () => {} });
    } catch (e) {
      caught = e as StreamError;
    }
    if (!caught) throw new Error("expected throw");
    if (caught.partialText !== "<html>half") throw new Error(`partialText=${caught.partialText}`);
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
