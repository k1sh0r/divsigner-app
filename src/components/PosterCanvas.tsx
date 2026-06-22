import { useEffect, useRef, useState } from "react";
import { PreviewFrame } from "./PreviewFrame";
import { PlusIcon } from "./ui/icons";
import type { GenJob, Variant } from "../hooks/useGeneration";
import type { HistoryBatch } from "../hooks/useHistory";
import { ASPECT_RATIOS, type AspectRatioKey } from "../utils/constants";
import type { AssetMap } from "../utils/assets";
import { BackgroundLayer } from "../backgrounds/components/BackgroundLayer";

function InterruptionBadge({ variant }: { variant: Variant }) {
  if (!variant.wasInterrupted) return null;
  return (
    <div
      className="absolute left-0 right-0 top-0 z-20 flex items-center justify-center gap-2 rounded-t-md border-b border-warning/40 bg-warning/15 px-3 py-1.5 animate-[fadeIn_200ms_ease]"
      title={variant.error || "Generation was interrupted"}
    >
      <WarningTriangleIcon />
      <span className="text-[11px] font-medium text-warning">
        Interrupted
        {variant.retryCount ? ` · ${variant.retryCount} retry` : ""}
        {variant.retryCount && variant.retryCount > 1 ? "ies" : variant.retryCount === 1 ? "y" : ""}
      </span>
    </div>
  );
}

function WarningTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-warning">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export type FocusRef =
  | { kind: "job"; jobId: string }
  | { kind: "history"; batchId: string; index: number };

export type FocusInfo =
  | { kind: "new" }
  | {
      kind: "design";
      html: string;
      aspectRatio: AspectRatioKey;
      ref: FocusRef;
    };

interface PosterCanvasProps {
  jobs: GenJob[];
  batches: HistoryBatch[];
  /** Batch ids already shown as a job slide — excluded from the history list. */
  excludeBatchIds: Set<string>;
  /** Aspect ratio used to size the "New design" slide. */
  newSlideAspect: AspectRatioKey;
  exporting: boolean;
  onExport: (html: string, ar: AspectRatioKey) => void;
  onDownload: (html: string, ar: AspectRatioKey) => void;
  fontEmbedCSS: string;
  assets: AssetMap;
  compare: boolean;
  onFocusChange: (f: FocusInfo) => void;
  onSelectVariant: (jobId: string, index: number) => void;
  bgPaused?: boolean;
}

function StreamingView({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [variant.streamingText, variant.thinking]);
  return (
    <div className="flex h-full w-full max-w-2xl flex-col py-10">
      <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent-soft">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
        {variant.thinking && !variant.streamingText ? "Thinking" : "Generating"}
      </div>
      <div
        ref={ref}
        className="scroll-thin flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-4 font-mono text-[12px] leading-relaxed"
      >
        {variant.thinking && (
          <pre className="mb-3 whitespace-pre-wrap break-words text-text-faint">
            {variant.thinking}
          </pre>
        )}
        <pre className="whitespace-pre-wrap break-words text-text-muted">
          {variant.streamingText}
          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle" />
        </pre>
      </div>
    </div>
  );
}

function Poster({
  html,
  aspectRatio,
  fontEmbedCSS,
  assets,
  onExport,
  onDownload,
  exporting,
  variant,
  bgPaused,
}: {
  html: string;
  aspectRatio: AspectRatioKey;
  fontEmbedCSS: string;
  assets: AssetMap;
  onExport: (html: string, ar: AspectRatioKey) => void;
  onDownload: (html: string, ar: AspectRatioKey) => void;
  exporting: boolean;
  variant?: Variant;
  bgPaused?: boolean;
}) {
  const dims = ASPECT_RATIOS[aspectRatio];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale =
    box.w && box.h ? Math.min(box.w / dims.width, box.h / dims.height) : 0;

  return (
    <div ref={wrapRef} className="group relative flex h-full w-full items-center justify-center">
      {variant && <InterruptionBadge variant={variant} />}
      {scale > 0 && (
        <div
          style={{
            position: "relative",
            width: dims.width * scale,
            height: dims.height * scale,
            overflow: "hidden",
            boxShadow: "0 24px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Background layer at the DISPLAYED size, rendered OUTSIDE the scale
              transform. WebGL/R3F components size their canvas from the
              container's getBoundingClientRect, which reflects CSS transforms —
              rendering inside the scaled wrapper made them measure the shrunken
              preview box and leave the layer undersized (gaps). Measuring the
              real box here lets every background fill. Export is unaffected: it
              renders the background separately at full resolution. */}
          <BackgroundLayer
            html={html}
            width={Math.round(dims.width * scale)}
            height={Math.round(dims.height * scale)}
            paused={bgPaused}
          />
          {/* Full-size HTML content scaled down to fit, layered over the bg. */}
          <div
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 10,
            }}
          >
            <PreviewFrame html={html} aspectRatio={aspectRatio} fontEmbedCSS={fontEmbedCSS} assets={assets} />
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute right-3 top-3 flex gap-2 opacity-0 translate-y-[-4px] transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        <button
          onClick={() => onExport(html, aspectRatio)}
          disabled={exporting}
          className="pointer-events-auto rounded-md bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black transition-all duration-150 disabled:opacity-50 btn-tactile"
        >
          {exporting ? "Exporting…" : "Download PNG"}
        </button>
        <button
          onClick={() => onDownload(html, aspectRatio)}
          className="pointer-events-auto rounded-md bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black transition-all duration-150 btn-tactile"
        >
          HTML
        </button>
      </div>
    </div>
  );
}

function VariantPills({
  count,
  selected,
  onSelect,
  statuses,
}: {
  count: number;
  selected: number;
  onSelect: (i: number) => void;
  statuses?: Variant[];
}) {
  if (count <= 1) return null;
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 pb-4">
      {Array.from({ length: count }, (_, i) => {
        const st = statuses?.[i]?.status;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-xs font-mono transition-all duration-150 btn-tactile ${
              i === selected
                ? "border-accent bg-accent/15 text-text shadow-[0_0_10px_rgba(107,87,238,0.15)]"
                : "border-border bg-surface-2 text-text-muted hover:border-border-strong hover:text-text"
            }`}
          >
            {st === "streaming" ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            ) : st === "error" ? (
              <span className="text-danger">!</span>
            ) : (
              `V${i + 1}`
            )}
          </button>
        );
      })}
    </div>
  );
}

function Slide({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <section className="relative flex h-full shrink-0 snap-center flex-col">
      {label && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 max-w-[60%] truncate rounded-md border border-border bg-surface/80 px-3 py-1 text-[11px] text-text-muted backdrop-blur transition-opacity duration-200">
          {label}
        </div>
      )}
      {children}
    </section>
  );
}

export function PosterCanvas(props: PosterCanvasProps) {
  const {
    jobs,
    batches,
    excludeBatchIds,
    newSlideAspect,
    exporting,
    onExport,
    onDownload,
    fontEmbedCSS,
    assets,
    compare,
    onFocusChange,
    onSelectVariant,
    bgPaused,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  // Per-history-batch selected variant index.
  const [histSel, setHistSel] = useState<Record<string, number>>({});
  // Track the most recent job id so we can scroll to a newly added job.
  const lastJobId = useRef<string | null>(null);

  // Oldest → newest history, excluding batches already shown as job slides.
  const historyBatches = [...batches]
    .reverse()
    .filter((b) => !excludeBatchIds.has(b.id));

  const H = historyBatches.length;
  const J = jobs.length;
  const newIdx = H + J;

  const reportFocus = (idx: number) => {
    if (idx === newIdx) {
      onFocusChange({ kind: "new" });
      return;
    }
    if (idx >= H && idx < H + J) {
      const job = jobs[idx - H]!;
      const v = job.variants[job.activeIndex];
      if (v?.html) {
        onFocusChange({
          kind: "design",
          html: v.html,
          aspectRatio: job.aspectRatio,
          ref: { kind: "job", jobId: job.id },
        });
      } else {
        // Streaming / error with no html yet — still focus the job so the
        // contextual button (Stop/Retry) targets it.
        onFocusChange({
          kind: "design",
          html: "",
          aspectRatio: job.aspectRatio,
          ref: { kind: "job", jobId: job.id },
        });
      }
      return;
    }
    const b = historyBatches[idx];
    const sel = b ? histSel[b.id] ?? 0 : 0;
    const item = b?.items[sel];
    if (b && item) {
      onFocusChange({
        kind: "design",
        html: item.html,
        aspectRatio: b.aspectRatio,
        ref: { kind: "history", batchId: b.id, index: sel },
      });
    }
  };

  // Scroll to a newly added job (generate / open history / import).
  useEffect(() => {
    const last = jobs[J - 1];
    if (last && last.id !== lastJobId.current) {
      lastJobId.current = last.id;
      const el = scrollRef.current;
      const target = H + J - 1;
      if (el) el.scrollTo({ top: target * el.clientHeight });
      setFocusIdx(target);
      reportFocus(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  // On first mount, center on the "New" slide so the Generate button is
  // immediately actionable (otherwise a fresh load with history would sit on
  // the oldest slide while focus still says "new").
  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;
    const el = scrollRef.current;
    const target = newIdx;
    if (el) el.scrollTo({ top: target * el.clientHeight });
    setFocusIdx(target);
    reportFocus(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== focusIdx) {
      setFocusIdx(idx);
      reportFocus(idx);
    }
  };

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  };

  const slides = newIdx + 1;

  // Notes pane: show the focused job's active-variant notes (if any).
  const focusedJob =
    focusIdx >= H && focusIdx < H + J ? jobs[focusIdx - H] : null;
  const focusedVariant = focusedJob?.variants[focusedJob.activeIndex] ?? null;
  const notesText = focusedVariant?.notes || "";

  return (
    <div className="flex h-full min-h-0 w-full">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex min-w-0 flex-1 snap-y snap-mandatory flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* History (oldest → newest), full size */}
        {historyBatches.map((b, i) => {
          const sel = histSel[b.id] ?? 0;
          const item = b.items[sel]!;
          return (
            <Slide key={b.id} label={b.prompt || "Untitled"}>
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                <Poster
                  html={item.html}
                  aspectRatio={b.aspectRatio}
                  fontEmbedCSS={fontEmbedCSS}
                  assets={assets}
                  onExport={onExport}
                  onDownload={onDownload}
                  exporting={exporting}
                  bgPaused={bgPaused}
                />
              </div>
              <VariantPills
                count={b.items.length}
                selected={sel}
                onSelect={(idx) => {
                  setHistSel((m) => ({ ...m, [b.id]: idx }));
                  if (i === focusIdx)
                    onFocusChange({
                      kind: "design",
                      html: b.items[idx]!.html,
                      aspectRatio: b.aspectRatio,
                      ref: { kind: "history", batchId: b.id, index: idx },
                    });
                }}
              />
              <span className="sr-only">history {i}</span>
            </Slide>
          );
        })}

        {/* One slide per generation job (streaming / error / done) */}
        {jobs.map((job, ji) => {
          const v = job.variants[job.activeIndex]!;
          const showCompare = compare && job.variants.length > 1;
          return (
            <Slide key={job.id} label={job.prompt || undefined}>
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                {v.status === "streaming" ? (
                  <StreamingView variant={v} />
                ) : v.status === "error" && !v.html ? (
                  <div className="max-w-md text-center animate-[fadeIn_300ms_ease]">
                    <div className="text-sm font-medium text-danger">
                      {v.error ?? "Generation failed"}
                    </div>
                    <div className="mt-1 text-xs text-text-faint">
                      {v.notes
                        ? "The model's response is shown in the notes pane."
                        : "Press Retry in the prompt bar to try again."}
                    </div>
                  </div>
                ) : showCompare ? (
                  <div className="grid h-full w-full grid-cols-2 gap-4">
                    {job.variants.map((vv, i) => (
                      <button
                        key={vv.id}
                        onClick={() => onSelectVariant(job.id, i)}
                        className={`relative overflow-hidden rounded-md border transition-all duration-200 hover:border-border-strong ${
                          i === job.activeIndex
                            ? "border-accent shadow-[0_0_16px_rgba(107,87,238,0.12)]"
                            : "border-border"
                        }`}
                      >
                        <span className="absolute left-2 top-2 z-10 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                          V{i + 1}
                        </span>
                        {vv.status === "done" && vv.html ? (
                          <div className="pointer-events-none h-full w-full">
                            <PreviewFrame
                              html={vv.html}
                              aspectRatio={job.aspectRatio}
                              fontEmbedCSS={fontEmbedCSS}
                              assets={assets}
                            />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-text-faint">
                            {vv.status === "streaming" ? "Generating…" : "—"}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Poster
                    html={v.html}
                    aspectRatio={job.aspectRatio}
                    fontEmbedCSS={fontEmbedCSS}
                    assets={assets}
                    onExport={onExport}
                    onDownload={onDownload}
                    exporting={exporting}
                    variant={v}
                    bgPaused={bgPaused}
                  />
                )}
              </div>
              {!showCompare && (
                <VariantPills
                  count={job.variants.length}
                  selected={job.activeIndex}
                  onSelect={(i) => onSelectVariant(job.id, i)}
                  statuses={job.variants}
                />
              )}
              <span className="sr-only">job {ji}</span>
            </Slide>
          );
        })}

        {/* New design */}
        <Slide>
          <div className="flex h-full items-center justify-center p-6">
            <div
              className="flex items-center justify-center rounded-lg border border-dashed border-border bg-surface transition-all duration-200 hover:border-border-strong hover:shadow-[0_0_30px_rgba(107,87,238,0.08)] group"
              style={{
                aspectRatio:
                  ASPECT_RATIOS[newSlideAspect].width /
                  ASPECT_RATIOS[newSlideAspect].height,
                width: "min(60%, 480px)",
                maxHeight: "100%",
              }}
            >
              <div className="px-6 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-2 text-text-muted transition-all duration-200 group-hover:border-accent group-hover:text-accent-soft group-hover:shadow-[0_0_12px_rgba(107,87,238,0.15)]">
                  <PlusIcon size={20} />
                </span>
                <div className="mt-3 font-display text-sm font-bold text-text">
                  New design
                </div>
                <div className="mt-1 text-xs text-text-faint">
                  Describe it below and Generate — starts fresh
                </div>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Dot rail + scroll hints */}
      {slides > 1 && (
        <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-2">
          {Array.from({ length: slides }, (_, i) => {
            const isNew = i === newIdx;
            const isJob = i >= H && i < H + J;
            const jobStreaming =
              isJob && jobs[i - H]?.loading ? true : false;
            return (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                title={
                  isNew
                    ? "New design"
                    : isJob
                      ? jobStreaming
                        ? "Generating"
                        : "Current"
                      : "Earlier"
                }
                className={`rounded-full transition-all duration-200 ${
                  i === focusIdx
                    ? jobStreaming
                      ? "h-5 w-1.5 bg-accent dot-active shadow-[0_0_8px_rgba(107,87,238,0.4)]"
                      : "h-5 w-1.5 bg-accent dot-active shadow-[0_0_8px_rgba(107,87,238,0.4)]"
                    : jobStreaming
                      ? "h-1.5 w-1.5 bg-accent/60 animate-pulse"
                      : "h-1.5 w-1.5 bg-border hover:bg-border-strong"
                }`}
              />
            );
          })}
        </div>
      )}

      {notesText && (
        <div className="flex w-72 shrink-0 flex-col border-l border-border bg-surface">
          <div className="section-label px-4 py-3">Model notes</div>
          <pre className="scroll-thin flex-1 overflow-y-auto whitespace-pre-wrap break-words px-4 pb-4 font-mono text-[12px] leading-relaxed text-text-muted">
            {notesText}
          </pre>
        </div>
      )}
    </div>
  );
}