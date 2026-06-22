import { memo, useEffect, useRef, useState } from "react";
import { PreviewFrame } from "./PreviewFrame";
import { StyleSwatch } from "./StyleSwatch";
import { StyleImportForm, type StyleImportValue } from "./StyleImportForm";
import { BackIcon, CloseIcon, InfoIcon, PlusIcon } from "./ui/icons";
import type { Style } from "../styles/types";
import type { ProviderConfig } from "../providers/types";

function Preview({ style, fontEmbedCSS, className }: { style: Style; fontEmbedCSS: string; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || shown) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    });
    io.observe(el); return () => io.disconnect();
  }, [shown]);
  return (
    <div ref={ref} className={`overflow-hidden rounded-md bg-bg ${className}`}>
      {shown && (style.sampleHtml
        ? <PreviewFrame html={style.sampleHtml} aspectRatio="1:1" fontEmbedCSS={fontEmbedCSS} />
        : <StyleSwatch designMd={style.designMd ?? ""} />)}
    </div>
  );
}

type View =
  | { kind: "gallery" }
  | { kind: "info"; id?: string };   // id present → view a style; absent → new import

function StylesPaneImpl({
  styles, selectedId, fontEmbedCSS, config,
  onSelect, onSaveStyle, onUpdateStyle, onDeleteCustom, onClose,
}: {
  styles: Style[]; selectedId: string; fontEmbedCSS: string; config: ProviderConfig;
  onSelect: (s: Style) => void;
  onSaveStyle: (v: StyleImportValue) => Style;
  onUpdateStyle: (id: string, v: StyleImportValue) => void;
  onDeleteCustom: (id: string) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>({ kind: "gallery" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setView((v) => (v.kind === "gallery" ? (onClose(), v) : { kind: "gallery" }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const presets = styles.filter((s) => s.source !== "custom");
  const customs = styles.filter((s) => s.source === "custom");
  const byId = (id: string) => styles.find((s) => s.id === id);

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button onClick={onBack} aria-label="Back"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-surface-2 hover:text-text btn-tactile">
            <BackIcon />
          </button>
        )}
        <h2 className="truncate font-display text-sm font-bold text-text">{title}</h2>
      </div>
      <div className="flex items-center gap-1.5">
        {view.kind === "gallery" && (
          <button onClick={() => setView({ kind: "info" })}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-border-strong hover:text-text btn-tactile">
            <PlusIcon size={13} /> Import
          </button>
        )}
        <button onClick={onClose} aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-all duration-150 hover:bg-surface-2 hover:text-text btn-tactile">
          <CloseIcon />
        </button>
      </div>
    </div>
  );

  // Clicking the row applies the style (and closes the pane); the (i) button
  // opens its info without applying.
  const Row = ({ s, i }: { s: Style; i: number }) => (
    <div className="group relative">
      <button
        onClick={() => onSelect(s)}
        style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
        className={`flex w-full items-center gap-3 rounded-lg border py-2 pl-2.5 pr-10 text-left transition-all duration-150 animate-[fadeIn_.25s_ease_both] btn-tactile ${
          s.id === selectedId ? "border-accent bg-accent/10 shadow-[0_0_12px_rgba(107,87,238,0.1)]" : "border-border hover:bg-surface-2 hover:border-border-strong"
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      >
        <Preview style={s} fontEmbedCSS={fontEmbedCSS} className="h-14 w-14 shrink-0" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-text">{s.name}</div>
          <div className="line-clamp-2 text-[11px] text-text-muted">{s.summary ?? s.description}</div>
        </div>
      </button>
      <button
        onClick={() => setView({ kind: "info", id: s.id })}
        aria-label={`${s.name} info`}
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition-all duration-150 hover:border-accent hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
      >
        <InfoIcon size={14} />
      </button>
    </div>
  );

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface">
      {view.kind === "gallery" && (
        <>
          <Header title="Styles" />
          <div className="scroll-thin flex flex-col gap-4 overflow-y-auto px-4 py-4 stagger-children">
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Presets</div>
              {presets.map((s, i) => <Row key={s.id} s={s} i={i} />)}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Your styles</div>
              {customs.length === 0
                ? <button onClick={() => setView({ kind: "info" })}
                    className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-text-muted transition-all duration-150 hover:border-accent hover:text-accent-soft">
                    No custom styles yet — Import one
                  </button>
                : customs.map((s, i) => <Row key={s.id} s={s} i={i} />)}
            </div>
          </div>
        </>
      )}

      {view.kind === "info" && (() => {
        const s = view.id ? byId(view.id) : undefined;

        // Read-only info for a built-in preset (can't edit or delete).
        if (s && s.source !== "custom") {
          return (
            <>
              <Header title={s.name} onBack={() => setView({ kind: "gallery" })} />
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                <Preview style={s} fontEmbedCSS={fontEmbedCSS} className="aspect-square w-28 border border-border" />
                <p className="text-sm text-text-muted">{s.summary ?? s.description}</p>
                <button onClick={() => onSelect(s)}
                  className="self-start rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover transition-all duration-150 btn-tactile">Use style</button>
              </div>
            </>
          );
        }

        // Editable info for a custom style, or the new-import form (no id).
        return (
          <>
            <Header title={s ? s.name : "Import style"}
              onBack={() => setView({ kind: "gallery" })} />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {s && (
                <div className="px-4 pt-4">
                  <Preview style={s} fontEmbedCSS={fontEmbedCSS} className="aspect-square w-28 border border-border" />
                </div>
              )}
              <StyleImportForm
                config={config}
                initial={s ? { name: s.name, summary: s.summary ?? "", designMd: s.designMd ?? "" } : undefined}
                onDelete={s ? () => { onDeleteCustom(s.id); setView({ kind: "gallery" }); } : undefined}
                onSave={(v) => {
                  if (s) onUpdateStyle(s.id, v);
                  else onSelect(onSaveStyle(v));
                  setView({ kind: "gallery" });
                }}
              />
            </div>
          </>
        );
      })()}
    </aside>
  );
}

/**
 * Memoized so the pane — and its per-style PreviewFrame iframes — don't
 * re-render on every streamed token / prompt keystroke (App re-renders on
 * each). Row/Header are defined inside the render, so an unwanted re-render
 * would otherwise remount every row and reload the preview iframes. The parent
 * passes a memoized `styles` array and `useCallback`-stabilized handlers.
 */
export const StylesPane = memo(StylesPaneImpl);
