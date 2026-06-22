import { isCompleteHtmlDocument } from "../utils/extract";

export interface StreamHandlers {
  /** Visible answer tokens (the HTML + any commentary). */
  onText: (delta: string) => void;
  /** Reasoning / thinking tokens, surfaced separately from the answer. */
  onThinking?: (delta: string) => void;
}

export interface StreamError extends Error {
  type: "stream_interrupted" | "network_error" | "parse_error";
  partialText: string;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function consumeStream(
  response: Response,
  format: "openai" | "anthropic",
  handlers: StreamHandlers,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response has no readable body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const handleEvent = (raw: string) => {
    const dataLines = raw
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    if (dataLines.length === 0) return;
    const payload = dataLines.join("");
    if (!payload || payload === "[DONE]") return;

    // Detect a true API error payload. We require `"error":` (a JSON key)
    // — NOT the bare substring `"error"` — so that CSS class names like
    // `class="error-banner"` or user content containing the word "error"
    // don't trigger a false-positive stream abort.
    const looksLikeError =
      payload.includes('"error":') || payload.includes('"error" :');
    if (looksLikeError) {
      let parsed: any;
      try {
        parsed = JSON.parse(payload);
      } catch {
        // Malformed JSON with the substring "error" — fall through and
        // try to render it as content rather than killing the stream.
        parsed = null;
      }
      if (parsed && parsed.error) {
        const msg =
          (typeof parsed.error === "string" ? parsed.error : parsed.error.message) ||
          "Stream interrupted";
        const err = new Error(msg) as StreamError;
        err.type = "stream_interrupted";
        err.partialText = fullText;
        throw err;
      }
    }

    let json: any;
    try {
      json = JSON.parse(payload);
    } catch {
      return;
    }

    if (format === "anthropic") {
      if (json.type === "content_block_delta") {
        const d = json.delta;
        if (d?.type === "text_delta" && d.text) {
          fullText += d.text;
          handlers.onText(d.text);
        } else if (d?.type === "thinking_delta" && d.thinking) {
          handlers.onThinking?.(d.thinking);
        }
      } else if (json.type === "message_delta") {
        // The model hit its output cap before finishing. Surface it as an
        // interruption so the partial document is saved and flagged, rather
        // than silently presenting a truncated poster as a clean result.
        if (json.delta?.stop_reason === "max_tokens") flagTruncated();
      }
      return;
    }

    // OpenAI-compatible
    const choice = json.choices?.[0];
    const delta = choice?.delta;
    const reasoning = delta?.reasoning_content ?? delta?.reasoning;
    if (reasoning) handlers.onThinking?.(reasoning);
    if (delta?.content) {
      fullText += delta.content;
      handlers.onText(delta.content);
    }
    // `length` means the response was cut off at max_tokens. Treat an
    // unfinished document as an interruption (see the anthropic branch).
    if (choice?.finish_reason === "length") flagTruncated();
  };

  // Raised once a provider tells us the output was truncated at the token cap.
  // We only escalate to an error if the document isn't already complete —
  // models often report `length` on trailing chain-of-thought we don't need.
  const flagTruncated = () => {
    if (isCompleteHtmlDocument(fullText)) return;
    const err = new Error(
      "Generation was cut off at the model's output limit before the " +
        "document was complete.",
    ) as StreamError;
    err.type = "stream_interrupted";
    err.partialText = fullText;
    throw err;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        handleEvent(event);
      }

      // Early termination: once a complete HTML document has been produced,
      // stop reading. Reasoning models frequently keep emitting chain-of-thought
      // AFTER "</html>", which only prolongs the stream and increases the chance
      // of a network interruption or timeout for output we'd discard anyway.
      if (isCompleteHtmlDocument(fullText)) {
        await reader.cancel().catch(() => {});
        break;
      }
    }
    if (buffer.trim()) handleEvent(buffer);
  } catch (err) {
    // Network errors or stream interruptions
    const streamErr = err as StreamError;
    if (streamErr.type) {
      streamErr.partialText = fullText;
      throw streamErr;
    }
    // Wrap other errors
    const wrappedErr = new Error(
      err instanceof Error ? err.message : "Stream interrupted"
    ) as StreamError;
    wrappedErr.type = "stream_interrupted";
    wrappedErr.partialText = fullText;
    throw wrappedErr;
  }

  return fullText;
}

/** True for errors that are worth retrying: stream interruptions, network
 * failures (browser `TypeError`, `AbortError`, Node `ECONN*`), and HTTP 5xx
 * surfaced by the relay. 4xx responses are passed through — they signal a
 * client mistake (bad key, bad model name) that retry cannot fix. */
export function shouldRetryStreamError(err: Error): boolean {
  const streamErr = err as StreamError;
  if (streamErr.type === "stream_interrupted") return true;
  // Browser fetch() throws TypeError on most network failures.
  if (err.name === "TypeError") return true;
  // AbortError surfaces when a fetch times out (browser or relay-side).
  // The user-initiated stop path doesn't reach this — Stop calls
  // controller.abort() *and* bumps runId, so this is always a real failure.
  if (err.name === "AbortError") return true;
  // HTTP 5xx from the relay is encoded in the message by `fetchStreamWithRetry`:
  //   `throw new Error(`${response.status}: ${errBody.slice(0, 300)}`)`
  const m = err.message.match(/^(\d{3})\b/);
  if (m) {
    const status = Number(m[1]);
    if (status >= 500 && status < 600) return true;
    if (status >= 400 && status < 500) return false;
  }
  // Node / undici / undici-style network errors.
  if (/econn|etimedout|enotfound|ehostunreach|enetunreach|fetch failed|network/i.test(
    err.message,
  )) {
    return true;
  }
  return false;
}

/**
 * Retry a stream fetch with exponential backoff.
 * Useful for handling transient network issues and API interruptions.
 */
export async function fetchStreamWithRetry(
  fetchFn: () => Promise<Response>,
  format: "openai" | "anthropic",
  handlers: StreamHandlers,
  options: RetryOptions = {},
): Promise<string> {
  const {
    maxRetries = 2,
    baseDelayMs = 1000,
    shouldRetry = shouldRetryStreamError,
    onRetry,
  } = options;

  let lastError: Error | null = null;
  let accumulatedText = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn();

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`${response.status}: ${errBody.slice(0, 300)}`);
      }

      const result = await consumeStream(response, format, {
        onText: (delta) => {
          accumulatedText += delta;
          handlers.onText(delta);
        },
        onThinking: handlers.onThinking,
      });

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry if we've accumulated meaningful content (>500 chars).
      // HTML pages are large, so 100 chars was too low and caused useless
      // retries that threw away good partial work.
      if (accumulatedText.length > 500) {
        const streamErr = lastError as StreamError;
        streamErr.partialText = accumulatedText;
        throw streamErr;
      }

      if (attempt < maxRetries && shouldRetry(lastError)) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        onRetry?.(attempt + 1, lastError);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        const streamErr = lastError as StreamError;
        streamErr.partialText = accumulatedText;
        throw streamErr;
      }
    }
  }

  throw lastError ?? new Error("Stream failed after retries");
}
