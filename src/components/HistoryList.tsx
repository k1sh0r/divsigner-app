import { useState } from "react";
import { PreviewFrame } from "./PreviewFrame";
import { CheckIcon, CopyIcon, TrashIcon } from "./ui/icons";
import type { HistoryBatch, HistoryItem } from "../hooks/useHistory";
import type { AssetMap } from "../utils/assets";

interface HistoryListProps {
  batches: HistoryBatch[];
  fontEmbedCSS: string;
  assets: AssetMap;
  onOpen: (batch: HistoryBatch, item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryList({
  batches,
  fontEmbedCSS,
  assets,
  onOpen,
  onDelete,
  onClear,
}: HistoryListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPrompt = async (batch: HistoryBatch) => {
    const text = batch.prompt;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Fallback for contexts where the async clipboard API is blocked.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopiedId(batch.id);
      setTimeout(() => setCopiedId((c) => (c === batch.id ? null : c)), 1400);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center animate-[fadeIn_400ms_ease]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center" style={{ borderRadius: "var(--radius-pill)", border: "1px dashed var(--border-default)", background: "var(--glass-2)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] text-text-muted">
            No generations yet
          </div>
          <div className="mt-1 text-xs text-text-faint">
            Your history will appear here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-thin mx-auto h-full max-w-4xl overflow-y-auto px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-label">All generations · {batches.length}</h2>
        <button
          onClick={onClear}
          className="rounded-sm text-xs font-medium text-text-faint transition-colors duration-150 hover:text-danger"
        >
          Clear all
        </button>
      </div>

      <div className="divide-y divide-border/70 border-y border-border/70">
        {batches.map((batch, i) => {
          const copied = copiedId === batch.id;
          return (
            <div
              key={batch.id}
              style={{ animationDelay: `${i * 30}ms` }}
              className="group/row flex items-center gap-4 py-3 transition-all duration-150 hover:bg-surface/60 animate-[fadeIn_300ms_ease_both]"
            >
              {/* Stacked deck — only the first variant is rendered; the rest
                  peek behind as cards. */}
              <button
                onClick={() => onOpen(batch, batch.items[0]!)}
                title="Open in canvas"
                className="relative shrink-0 transition-transform duration-200 hover:scale-[1.02]"
                style={{ width: 68, height: 64 }}
              >
                {batch.items.length > 2 && (
                  <span className="absolute rounded-sm border border-border bg-surface-2 shadow-sm" style={{ left: 8, top: 6, width: 56, height: 56 }} />
                )}
                {batch.items.length > 1 && (
                  <span className="absolute rounded-sm border border-border bg-surface-2 shadow-sm" style={{ left: 4, top: 3, width: 58, height: 58 }} />
                )}
                <span className="absolute left-0 top-0 block overflow-hidden rounded-sm border border-border bg-bg transition-all duration-200 group-hover/row:border-accent group-hover/row:shadow-[0_0_12px_rgba(107,87,238,0.12)]">
                  <span className="pointer-events-none block h-[60px] w-[60px]">
                    <PreviewFrame
                      html={batch.items[0]!.html}
                      aspectRatio={batch.aspectRatio}
                      fontEmbedCSS={fontEmbedCSS}
                      assets={assets}
                    />
                  </span>
                </span>
                {batch.items.length > 1 && (
                  <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center px-1 font-mono text-[10px] font-bold text-white" style={{ borderRadius: "var(--radius-pill)", background: "var(--grad-accent)", boxShadow: "var(--glow-soft)" }}>
                    {batch.items.length}
                  </span>
                )}
              </button>

              {/* Prompt + meta on one line */}
              <button
                onClick={() => onOpen(batch, batch.items[0]!)}
                className="flex min-w-0 flex-1 items-baseline gap-3 text-left"
                title="Open in canvas"
              >
                <span className="truncate text-sm text-text-muted transition-colors duration-150 group-hover/row:text-text">
                  {batch.prompt || (
                    <span className="text-text-faint">Untitled</span>
                  )}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[11px] uppercase tracking-wider text-text-faint">
                  {batch.items.length}× · {batch.aspectRatio} ·{" "}
                  {timeAgo(batch.createdAt)}
                </span>
              </button>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => copyPrompt(batch)}
                  title="Copy prompt"
                  className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all duration-150 btn-tactile ${
                    copied
                      ? "border-accent/50 bg-accent/15 text-accent-soft"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => onDelete(batch.id)}
                  title="Delete generation"
                  aria-label="Delete generation"
                  style={{ borderRadius: "var(--radius-sm)", boxShadow: "var(--emboss-neutral)" }} className="flex h-8 w-8 items-center justify-center text-text-faint transition-all duration-150 hover:text-danger btn-tactile"
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
