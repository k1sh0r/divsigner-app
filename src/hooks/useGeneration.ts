import { useState, useCallback, useRef } from "react";
import type {
  ProviderConfig,
  ChatMessage,
  ContentPart,
} from "../providers/types";
import { buildRequestBody } from "../providers/adapter";
import { getCompletionUrl, PROVIDERS } from "../providers/config";
import { needsRelay, relayFetch } from "../providers/relay";
import { fetchStreamWithRetry } from "../providers/stream";
import { buildSystemPrompt } from "../styles/prompt-builder";
import { sanitizeHTML } from "../utils/sanitize";
import { splitHtml, isCompleteHtmlDocument } from "../utils/extract";
import type { Style } from "../styles/types";
import type { AspectRatioKey } from "../utils/constants";

export interface Variant {
  id: number;
  /** Raw visible answer text streamed so far. */
  streamingText: string;
  /** Reasoning / thinking text streamed so far. */
  thinking: string;
  /** Sanitized HTML document (empty until extracted). */
  html: string;
  /** Raw (unsanitized) HTML, for the code editor. */
  rawHtml: string;
  /** Non-HTML prose the model emitted alongside the document. */
  notes: string;
  status: "streaming" | "done" | "error";
  error?: string;
  /** True if the stream was interrupted but partial HTML was saved. */
  wasInterrupted?: boolean;
  /** How many retry attempts were made (0 if none). */
  retryCount?: number;
}

export interface GenerateAsset {
  id: string;
  name: string;
  dataUrl: string;
}

export interface GenerateOptions {
  /** Vision references — guide the design, not embedded. */
  referenceImages?: string[];
  /** Assets embedded as-is (logo/screenshot) via `asset://<id>` tokens. */
  assets?: GenerateAsset[];
  count?: number;
  /** If set, iterate on this existing poster HTML instead of starting fresh. */
  baseHtml?: string;
}

/** A single generation: one prompt producing 1–4 variants. Many jobs may run
 *  concurrently; each is its own slide in the canvas. */
export interface GenJob {
  id: string;
  prompt: string;
  presetId: string;
  aspectRatio: AspectRatioKey;
  /** Original options, retained so the job can be retried verbatim. */
  opts: GenerateOptions;
  variants: Variant[];
  activeIndex: number;
  loading: boolean;
  /** The history-batch id this job corresponds to, once known. Set when the
   *  job is recorded into history OR when opened from history/import — the
   *  canvas uses this to avoid double-showing that batch as a history slide. */
  recordedBatchId?: string;
}

interface UseGenerationReturn {
  /** All jobs, in creation order (oldest first). */
  jobs: GenJob[];
  /** True if at least one job is currently streaming. */
  anyLoading: boolean;
  /** Number of jobs currently streaming (for the concurrency cap). */
  loadingCount: number;
  /** Most recent error message (informational; per-job errors are shown on
   *  their own slide with a Retry button). */
  error: string | null;
  /** Max concurrent streaming jobs. `generate` refuses past this. */
  readonly maxConcurrent: number;
  /** Start a new generation job (appends; never disturbs running jobs). */
  generate: (
    style: Style,
    aspectRatio: AspectRatioKey,
    userPrompt: string,
    options?: GenerateOptions,
  ) => string | null;
  /** Re-run a job's prompt from scratch (replaces its variants). */
  retry: (jobId: string) => void;
  /** Abort one job, keeping any partial HTML as a usable design. */
  stop: (jobId: string) => void;
  /** Select which variant of a job is active/visible. */
  setActiveVariant: (jobId: string, index: number) => void;
  /** Edit the active variant's HTML of a job (code editor / backgrounds). */
  setJobHtml: (jobId: string, html: string) => void;
  /** Record that a job has been persisted to history under `batchId`. */
  markRecorded: (jobId: string, batchId: string) => void;
  /** Show a single finished design as a one-variant job (open history /
   *  import). `excludeBatchId` suppresses that batch in the history list.
   *  `ar` sets the job's aspect ratio (defaults to 1:1). */
  loadVariant: (
    html: string,
    rawHtml: string,
    excludeBatchId?: string,
    ar?: AspectRatioKey,
  ) => void;
  /** Clear all jobs (e.g. not needed currently, but keeps the surface tidy). */
  clearJobs: () => void;
  /** Enhance a user prompt with marketing copywriting via LLM. */
  enhancePrompt: (userPrompt: string) => Promise<string>;
}

const MAX_CONCURRENT = 4;

function makeId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function newVariant(id: number): Variant {
  return {
    id,
    streamingText: "",
    thinking: "",
    html: "",
    rawHtml: "",
    notes: "",
    status: "streaming",
  };
}

/** Build the chat messages for a generation. Shared by `generate` and `retry`. */
function buildMessages(
  style: Style,
  aspectRatio: AspectRatioKey,
  userPrompt: string,
  options: GenerateOptions | undefined,
): ChatMessage[] {
  const referenceImages = options?.referenceImages ?? [];
  const assets = options?.assets ?? [];

  const systemPrompt = buildSystemPrompt(
    style,
    aspectRatio,
    referenceImages.length > 0,
  );

  let promptText = options?.baseHtml
    ? `${userPrompt}\n\nITERATE ON THE CURRENT DESIGN below. Apply the change above and return the COMPLETE updated HTML document, preserving everything not mentioned.\n\nCURRENT DESIGN HTML:\n${options.baseHtml}`
    : userPrompt;

  if (assets.length > 0) {
    promptText +=
      `\n\nEMBED THESE ASSETS exactly as provided — do NOT recreate, redraw, or describe them. Insert each with an <img> tag using the EXACT src token below, then size and position it with CSS to fit the design (logos top-left/centered, screenshots/mockups as focal imagery):\n` +
      assets
        .map((a) => `- ${a.name}: <img src="asset://${a.id}" alt="${a.name}">`)
        .join("\n") +
      `\nUse the token src verbatim. Never inline base64. Place logos/marks; use other assets where they fit.`;
  }

  const images = [...referenceImages, ...assets.map((a) => a.dataUrl)];
  const userContent: string | ContentPart[] =
    images.length > 0
      ? [
          { type: "text", text: promptText },
          ...images.map(
            (url): ContentPart => ({ type: "image_url", image_url: { url } }),
          ),
        ]
      : promptText;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
}

export function useGeneration(config: ProviderConfig): UseGenerationReturn {
  const [jobs, setJobs] = useState<GenJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Per-job run ids: late stream deltas are ignored once a job is retried/stopped.
  const runIdMap = useRef<Record<string, number>>({});
  // Per-job abort controllers.
  const abortMap = useRef<Record<string, AbortController | null>>({});
  // Per-job cached chat messages, so a retry can re-run without the Style obj.
  const messagesMap = useRef<Record<string, ChatMessage[]>>({});

  const loadingCount = jobs.filter((j) => j.loading).length;

  const patchJob = useCallback(
    (jobId: string, patch: Partial<GenJob> | ((j: GenJob) => GenJob)) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id !== jobId
            ? j
            : typeof patch === "function"
              ? patch(j)
              : { ...j, ...patch },
        ),
      );
    },
    [],
  );

  const patchVariant = useCallback(
    (
      jobId: string,
      index: number,
      patch: Partial<Variant> | ((v: Variant) => Variant),
    ) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            variants: j.variants.map((v, i) =>
              i !== index
                ? v
                : typeof patch === "function"
                  ? patch(v)
                  : { ...v, ...patch },
            ),
          };
        }),
      );
    },
    [],
  );

  /** Stream one variant of one job to completion. */
  const runOne = useCallback(
    async (
      jobId: string,
      index: number,
      messages: ChatMessage[],
      thisRun: number,
      signal: AbortSignal,
    ): Promise<void> => {
      const def = PROVIDERS[config.providerId];
      const completionUrl = getCompletionUrl(config);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (def.format === "anthropic") {
        headers["x-api-key"] = config.apiKey;
        headers["anthropic-version"] = "2023-06-01";
        if (def.anthropicHeader) {
          const parts = def.anthropicHeader.split(": ");
          if (parts[0] && parts[1]) headers[parts[0]] = parts[1];
        }
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const doFetch = needsRelay(config.providerId)
        ? (url: string, init: RequestInit) =>
            relayFetch(url, config.apiKey, { ...init, headers })
        : (url: string, init: RequestInit) =>
            fetch(url, { ...init, headers });

      const isCurrent = () => runIdMap.current[jobId] === thisRun;

      let retryCount = 0;

      // Stream a single request, live-appending answer/thinking to the variant.
      const streamOnce = (msgs: ChatMessage[]): Promise<string> => {
        const reqBody = buildRequestBody(config, msgs, true);
        return fetchStreamWithRetry(
          async () =>
            doFetch(completionUrl, {
              method: "POST",
              body: JSON.stringify(reqBody),
              headers,
              signal,
            }),
          def.format,
          {
            onText: (delta) => {
              if (!isCurrent()) return;
              patchVariant(jobId, index, (v) => ({
                ...v,
                streamingText: v.streamingText + delta,
              }));
            },
            onThinking: (delta) => {
              if (!isCurrent()) return;
              patchVariant(jobId, index, (v) => ({
                ...v,
                thinking: v.thinking + delta,
              }));
            },
          },
          {
            maxRetries: 2,
            baseDelayMs: 1000,
            onRetry: (attempt) => {
              retryCount = attempt;
              console.warn(`Job ${jobId} v${index + 1} retry attempt ${attempt}`);
            },
          },
        );
      };

      // Assemble the answer across one or more requests. If a response is cut
      // off before </html> (token cap, timeout, or interruption), continue it
      // from where it stopped rather than surfacing a truncated poster. This is
      // the model-agnostic robustness lever: it works no matter how much the
      // model "thinks" or whether the gateway honors thinking-control fields.
      const MAX_CONTINUATIONS = 2;
      let assembled = "";
      let convo = messages;
      let interrupted = false;
      let fatalErr: { message?: string; retryCount?: number } | null = null;

      for (let cont = 0; cont <= MAX_CONTINUATIONS; cont++) {
        try {
          assembled += await streamOnce(convo);
        } catch (err) {
          const se = err as { type?: string; partialText?: string };
          if (
            se.type === "stream_interrupted" &&
            typeof se.partialText === "string"
          ) {
            assembled += se.partialText;
            interrupted = true;
          } else {
            fatalErr = err as { message?: string; retryCount?: number };
            break;
          }
        }

        if (!isCurrent()) return;

        if (isCompleteHtmlDocument(assembled)) {
          interrupted = false;
          break;
        }
        if (cont === MAX_CONTINUATIONS) break;
        // Only continue if we already have a real HTML fragment to extend;
        // otherwise there's nothing for the model to pick up from.
        if (!splitHtml(assembled).html) break;

        convo = [
          ...messages,
          { role: "assistant", content: assembled },
          {
            role: "user",
            content:
              "Your previous HTML was cut off before </html>. Continue from " +
              "EXACTLY where it stopped — output only the remaining markup, do " +
              "not repeat anything already sent, and finish with </html>. No " +
              "commentary.",
          },
        ];
        interrupted = false; // re-evaluated after the continuation completes
      }

      if (!isCurrent()) return;

      const { html, notes } = splitHtml(assembled);
      if (html) {
        patchVariant(jobId, index, {
          status: "done",
          rawHtml: html,
          html: sanitizeHTML(html),
          notes: notes || "",
          retryCount,
          ...(interrupted
            ? {
                wasInterrupted: true,
                error:
                  "Generation was interrupted, but usable content was saved. " +
                  "You can refine or iterate on it.",
              }
            : {}),
        });
      } else if (fatalErr) {
        patchVariant(jobId, index, {
          status: "error",
          error: fatalErr.message || "Generation failed",
          retryCount: fatalErr.retryCount ?? retryCount,
        });
      } else {
        patchVariant(jobId, index, {
          status: "error",
          error: interrupted
            ? "Stream interrupted before HTML was generated. Please retry."
            : "No HTML document found in the response.",
          streamingText: assembled,
          wasInterrupted: interrupted || undefined,
          retryCount,
        });
      }
    },
    [config, patchVariant],
  );

  /** Start (or restart) streaming all variants of a job. Takes the messages
   *  and variant count directly so it never depends on stale job state. */
  const startJob = useCallback(
    (jobId: string, messages: ChatMessage[], count: number) => {
      const thisRun = (runIdMap.current[jobId] ?? 0) + 1;
      runIdMap.current[jobId] = thisRun;
      const controller = new AbortController();
      abortMap.current[jobId] = controller;

      patchJob(jobId, { loading: true });
      setError(null);

      // Fire all variants in parallel; flip loading off once all settle.
      Promise.all(
        Array.from({ length: count }, (_, i) =>
          runOne(jobId, i, messages, thisRun, controller.signal),
        ),
      ).finally(() => {
        if (runIdMap.current[jobId] !== thisRun) return;
        patchJob(jobId, { loading: false });
        abortMap.current[jobId] = null;
      });
    },
    [patchJob, runOne],
  );

  const generate = useCallback(
    (
      style: Style,
      aspectRatio: AspectRatioKey,
      userPrompt: string,
      options?: GenerateOptions,
    ): string | null => {
      const count = Math.max(1, Math.min(4, options?.count ?? 1));

      if (loadingCount >= MAX_CONCURRENT) {
        setError(
          `You can run up to ${MAX_CONCURRENT} generations at once. Wait for one to finish or stop it.`,
        );
        return null;
      }

      const id = makeId();
      const messages = buildMessages(style, aspectRatio, userPrompt, options);
      messagesMap.current[id] = messages;
      const job: GenJob = {
        id,
        prompt: userPrompt,
        presetId: style.id,
        aspectRatio,
        opts: options ?? {},
        variants: Array.from({ length: count }, (_, i) => newVariant(i)),
        activeIndex: 0,
        loading: true,
      };

      setJobs((prev) => [...prev, job]);
      // Begin streaming after the job is in state.
      queueMicrotask(() => startJob(id, messages, count));
      return id;
    },
    [loadingCount, startJob],
  );

  const retry = useCallback(
    (jobId: string) => {
      const existing = jobs.find((j) => j.id === jobId);
      if (!existing) return;
      const count = existing.variants.length;
      const messages = messagesMap.current[jobId] ?? [];
      setJobs((prev) =>
        prev.map((j) =>
          j.id !== jobId
            ? j
            : {
                ...j,
                variants: Array.from({ length: count }, (_, i) =>
                  newVariant(i),
                ),
                activeIndex: 0,
                loading: true,
                // A retry supersedes any prior recording — drop the stale link
                // so the canvas treats it as a fresh working slide; it'll be
                // re-recorded when it finishes.
                recordedBatchId: undefined,
              },
        ),
      );
      queueMicrotask(() => startJob(jobId, messages, count));
    },
    [jobs, startJob],
  );

  const stop = useCallback(
    (jobId: string) => {
      runIdMap.current[jobId] = (runIdMap.current[jobId] ?? 0) + 1;
      abortMap.current[jobId]?.abort();
      abortMap.current[jobId] = null;
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            loading: false,
            variants: j.variants.map((v) => {
              if (v.status !== "streaming") return v;
              const { html, notes } = splitHtml(v.streamingText);
              return html
                ? {
                    ...v,
                    status: "done" as const,
                    rawHtml: html,
                    html: sanitizeHTML(html),
                    notes,
                    wasInterrupted: true,
                  }
                : {
                    ...v,
                    status: "error" as const,
                    error: "Stopped before any HTML was generated.",
                    wasInterrupted: true,
                  };
            }),
          };
        }),
      );
    },
    [],
  );

  const setActiveVariant = useCallback(
    (jobId: string, index: number) => patchJob(jobId, { activeIndex: index }),
    [patchJob],
  );

  const setJobHtml = useCallback(
    (jobId: string, html: string) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== jobId) return j;
          return {
            ...j,
            variants: j.variants.map((v, i) =>
              i === j.activeIndex
                ? { ...v, rawHtml: html, html: sanitizeHTML(html) }
                : v,
            ),
          };
        }),
      );
    },
    [],
  );

  const markRecorded = useCallback(
    (jobId: string, batchId: string) => {
      patchJob(jobId, { recordedBatchId: batchId });
    },
    [patchJob],
  );

  const loadVariant = useCallback(
    (
      html: string,
      rawHtml: string,
      excludeBatchId?: string,
      ar: AspectRatioKey = "1:1",
    ) => {
      // Append a finished one-variant job showing this design. Does NOT
      // disturb any in-flight generations (each job streams independently).
      const id = makeId();
      const job: GenJob = {
        id,
        prompt: "",
        presetId: "",
        aspectRatio: ar,
        opts: {},
        variants: [{ ...newVariant(0), status: "done", html, rawHtml }],
        activeIndex: 0,
        loading: false,
        recordedBatchId: excludeBatchId,
      };
      setJobs((prev) => [...prev, job]);
    },
    [],
  );

  const clearJobs = useCallback(() => {
    for (const id of Object.keys(abortMap.current)) {
      abortMap.current[id]?.abort();
    }
    abortMap.current = {};
    runIdMap.current = {};
    setJobs([]);
  }, []);

  const enhancePrompt = useCallback(
    async (userPrompt: string): Promise<string> => {
      const enhanceModel = config.enhanceModel?.trim() || config.model;
      const def = PROVIDERS[config.providerId];

      const systemPrompt = `You are a marketing copywriting expert. Your task is to rewrite the user's brief into a detailed, compelling poster brief that will be used to generate an HTML marketing poster.

Enhance the brief with:
1. A compelling headline (primary message)
2. A subheadline that expands on the headline
3. 3-5 key benefits or selling points
4. A clear call-to-action (action-oriented: "Get X" not "Sign Up")
5. Optional: problem statement, solution, proof point, urgency

Guidelines:
- Use customer language, avoid jargon
- Be specific over vague (include numbers, timeframes where possible)
- Show benefits, not just features
- Keep it concise but impactful

Output ONLY the enhanced brief. Do not include explanations or markdown formatting.`;

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const body = buildRequestBody(
        { ...config, model: enhanceModel },
        messages,
        false,
      );
      const completionUrl = getCompletionUrl({
        ...config,
        model: enhanceModel,
      });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (def.format === "anthropic") {
        headers["x-api-key"] = config.apiKey;
        headers["anthropic-version"] = "2023-06-01";
        if (def.anthropicHeader) {
          const parts = def.anthropicHeader.split(": ");
          if (parts[0] && parts[1]) headers[parts[0]] = parts[1];
        }
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const doFetch = needsRelay(config.providerId)
        ? (url: string, init: RequestInit) =>
            relayFetch(url, config.apiKey, { ...init, headers })
        : (url: string, init: RequestInit) =>
            fetch(url, { ...init, headers });

      const response = await doFetch(completionUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Enhancement failed: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const text =
        def.format === "anthropic"
          ? data.content?.[0]?.text ?? ""
          : data.choices?.[0]?.message?.content ?? "";
      return text.trim();
    },
    [config],
  );

  return {
    jobs,
    anyLoading: loadingCount > 0,
    loadingCount,
    error,
    maxConcurrent: MAX_CONCURRENT,
    generate,
    retry,
    stop,
    setActiveVariant,
    setJobHtml,
    markRecorded,
    loadVariant,
    clearJobs,
    enhancePrompt,
  };
}
