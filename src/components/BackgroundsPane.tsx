import { useEffect, useState, useRef, Suspense, memo } from "react";
import { BackIcon, CloseIcon, InfoIcon, PauseIcon, PlayIcon } from "./ui/icons";
import { getAllBackgrounds, getBackground } from "../backgrounds/catalog";
import {
  parseBackgroundMeta,
  injectBackgroundMeta,
  makeBackgroundTransparent,
  restoreOriginalBackground,
} from "../backgrounds/parse";
import type {
  BackgroundDef,
  BackgroundSpec,
  BackgroundComponentEntry,
} from "../backgrounds/types";
import {
  GLOBAL_BACKGROUND_PARAMS,
  splitGlobalParams,
  DEFAULT_GLOBAL_PARAMS,
} from "../backgrounds/types";
import { BackgroundErrorBoundary } from "../backgrounds/components/BackgroundErrorBoundary";

type View = { kind: "gallery" } | { kind: "info"; id: string };

interface BackgroundsPaneProps {
  html: string;
  onUpdateHtml: (html: string) => void;
  onClose: () => void;
  /** Whether all background layers are paused. */
  paused: boolean;
  /** Toggle background layer pause state. */
  onTogglePause: () => void;
}

/** Derive a reasonable preview color from the background's first color param. */
function previewColor(def: BackgroundDef): string {
  for (const [, schema] of Object.entries(def.params)) {
    if (schema.type === "color") return String(schema.default);
    if (schema.type === "stringArray" && Array.isArray(schema.default)) {
      return schema.default[0] ?? "#111";
    }
  }
  // Fallback: pick a color from the category name
  const catColors: Record<string, string> = {
    canvas2d: "#1a1a2e",
    webgl: "#0f3460",
    three: "#16213e",
    css: "#1b1b2f",
  };
  return catColors[def.category] ?? "#111827";
}

/** A lightweight static preview tile for the gallery list. */
function BackgroundPreview({
  def,
  className,
}: {
  def: BackgroundDef;
  className?: string;
}) {
  const color = previewColor(def);
  return (
    <div
      className={`flex items-center justify-center rounded-md ${className}`}
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)` }}
      aria-hidden="true"
    />
  );
}

/**
 * A live-rendered preview of a background inside the info panel.
 * Renders the actual component at the container's measured size.
 * Global params (backgroundColor, opacity, blend) are applied via CSS on
 * the outer wrapper so changes update instantly without remounting.
 */
function LiveBackgroundPreview({
  entry,
  params,
}: {
  entry: BackgroundComponentEntry;
  params: Record<string, unknown>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el!.clientWidth, h: el!.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const { globalParams, rest: componentParams } = splitGlobalParams(params);
  const bgColor =
    (globalParams.backgroundColor as string) ?? DEFAULT_GLOBAL_PARAMS.backgroundColor;
  const opacity = globalParams.opacity ?? DEFAULT_GLOBAL_PARAMS.opacity;
  const blendMode =
    (globalParams.blendMode as string) ?? DEFAULT_GLOBAL_PARAMS.blendMode;

  return (
    <div
      ref={ref}
      className="w-full"
      style={{
        aspectRatio: "1 / 1",
        position: "relative",
        overflow: "hidden",
        borderRadius: "0.5rem",
        backgroundColor: bgColor,
        opacity,
        mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
      }}
    >
      {size.w > 0 && size.h > 0 && (
        <Suspense fallback={null}>
          <BackgroundErrorBoundary
            key={entry.id}
            backgroundColor={bgColor}
          >
            <entry.Component
              width={size.w}
              height={size.h}
              params={componentParams}
            />
          </BackgroundErrorBoundary>
        </Suspense>
      )}
    </div>
  );
}

/** Renders global layer params (backgroundColor, opacity, blendMode). */
function GlobalParamEditor({
  values,
  onChange,
}: {
  values: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      {/* backgroundColor */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text">BG Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={String(values.backgroundColor ?? DEFAULT_GLOBAL_PARAMS.backgroundColor)}
            onChange={(e) => set("backgroundColor", e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
          />
          <span className="text-xs font-mono text-text-muted">
            {String(values.backgroundColor ?? DEFAULT_GLOBAL_PARAMS.backgroundColor)}
          </span>
        </div>
      </div>

      {/* opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-text">Opacity</label>
          <span className="text-xs font-mono text-text-muted tabular-nums">
            {(Number(values.opacity ?? 1) * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={Number(values.opacity ?? 1)}
          onChange={(e) => set("opacity", parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      {/* blendMode */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text">Blend Mode</label>
        <select
          value={String(values.blendMode ?? "normal")}
          onChange={(e) => set("blendMode", e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
        >
          {(GLOBAL_BACKGROUND_PARAMS.blendMode?.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Parameter editor for per-background params. */
function ParamEditor({
  def,
  currentParams,
  onChange,
}: {
  def: BackgroundDef;
  currentParams: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(def.params).map(([key, schema]) => {
        const value = currentParams[key] ?? schema.default;

        if (schema.type === "number") {
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text">{key}</label>
                <span className="text-xs text-text-muted tabular-nums">
                  {String(value)}
                </span>
              </div>
              <input
                type="range"
                min={schema.min}
                max={schema.max}
                step={schema.step ?? 0.1}
                value={value as number}
                onChange={(e) =>
                  onChange({ ...currentParams, [key]: parseFloat(e.target.value) })
                }
                className="w-full accent-accent"
              />
            </div>
          );
        }

        if (schema.type === "color") {
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-xs font-medium text-text">{key}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={String(value)}
                  onChange={(e) =>
                    onChange({ ...currentParams, [key]: e.target.value })
                  }
                  className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-xs font-mono text-text-muted">
                  {String(value)}
                </span>
              </div>
            </div>
          );
        }

        if (schema.type === "stringArray") {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">{key}</label>
              <div className="flex flex-wrap gap-1">
                {(value as string[]).map((color, i) => (
                  <input
                    key={i}
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...(value as string[])];
                      newColors[i] = e.target.value;
                      onChange({ ...currentParams, [key]: newColors });
                    }}
                    className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                  />
                ))}
              </div>
            </div>
          );
        }

        if (schema.type === "select" && schema.options) {
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">{key}</label>
              <select
                value={String(value)}
                onChange={(e) =>
                  onChange({ ...currentParams, [key]: e.target.value })
                }
                className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
              >
                {schema.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (schema.type === "boolean") {
          return (
            <div key={key} className="flex items-center justify-between">
              <label className="text-xs font-medium text-text">{key}</label>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  onChange({ ...currentParams, [key]: e.target.checked })
                }
                className="h-4 w-4 accent-accent"
              />
            </div>
          );
        }

        // Default: text input
        return (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text">{key}</label>
            <input
              type="text"
              value={String(value)}
              onChange={(e) =>
                onChange({ ...currentParams, [key]: e.target.value })
              }
              className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-text"
            />
          </div>
        );
      })}
    </div>
  );
}

function BackgroundsPaneImpl({
  html,
  onUpdateHtml,
  onClose,
  paused,
  onTogglePause,
}: BackgroundsPaneProps) {
  const [view, setView] = useState<View>({ kind: "gallery" });
  const [currentSpec, setCurrentSpec] = useState<BackgroundSpec | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, unknown>>({});

  // Parse current background from HTML and initialise editedParams with both
  // per-background defaults and the global layer defaults.
  useEffect(() => {
    const spec = parseBackgroundMeta(html);
    setCurrentSpec(spec);
    if (spec) {
      const def = getBackground(spec.id);
      if (def) {
        const merged: Record<string, unknown> = {};
        // Global params first so they can be overridden
        for (const [key, schema] of Object.entries(GLOBAL_BACKGROUND_PARAMS)) {
          merged[key] = spec.params[key] ?? schema.default;
        }
        // Then per-background params (may override global)
        for (const [key, schema] of Object.entries(def.params)) {
          merged[key] = spec.params[key] ?? def.defaultParams[key] ?? schema.default;
        }
        setEditedParams(merged);
      }
    }
  }, [html]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setView((v) =>
        v.kind === "gallery" ? (onClose(), v) : { kind: "gallery" },
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const backgrounds = getAllBackgrounds();
  const byId = (id: string) => getBackground(id);

  const applyBackground = (
    id: string | null,
    params?: Record<string, unknown>,
  ) => {
    if (id === null) {
      let newHtml = html.replace(
        /<meta[^>]*name\s*=\s*["']divsigner-background["'][^>]*\/?>\s*/gi,
        "",
      );
      newHtml = restoreOriginalBackground(newHtml);
      onUpdateHtml(newHtml);
      setCurrentSpec(null);
    } else {
      const def = getBackground(id);
      if (!def) return;

      // Merge incoming params on top of the global defaults so global params
      // are always written into the background meta even when not explicitly set.
      const mergedParams: Record<string, unknown> = {
        ...editedParams,
        ...params,
      };
      // Ensure global defaults are present (in case editedParams wasn't initialised yet)
      for (const [key, schema] of Object.entries(GLOBAL_BACKGROUND_PARAMS)) {
        if (!(key in mergedParams)) mergedParams[key] = schema.default;
      }
      for (const [key, schema] of Object.entries(def.params)) {
        if (!(key in mergedParams)) {
          mergedParams[key] = def.defaultParams[key] ?? schema.default;
        }
      }

      const newSpec: BackgroundSpec = { id, params: mergedParams };
      let newHtml = injectBackgroundMeta(html, newSpec);
      newHtml = makeBackgroundTransparent(newHtml);
      onUpdateHtml(newHtml);
      setCurrentSpec(newSpec);
    }
  };

  const Header = ({
    title,
    onBack,
  }: {
    title: string;
    onBack?: () => void;
  }) => (
    <div className="flex h-14 shrink-0 items-center justify-between px-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex min-w-0 items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-7 w-7 items-center justify-center text-text-muted transition-all duration-150 hover:text-text btn-tactile"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            <BackIcon />
          </button>
        )}
        <h2 className="truncate font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] text-text">
          {title}
        </h2>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="flex h-7 w-7 items-center justify-center text-text-muted transition-all duration-150 hover:text-text btn-tactile"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        <CloseIcon />
      </button>
    </div>
  );

  const Row = ({ def, i }: { def: BackgroundDef; i: number }) => {
    const isSelected = currentSpec?.id === def.id;
    return (
      <div className="group relative">
        <button
          onClick={() => applyBackground(def.id)}
          style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
          className={`flex w-full items-center gap-3 rounded-lg border py-2 pl-2.5 pr-10 text-left transition-all duration-150 animate-[fadeIn_.25s_ease_both] btn-tactile ${
            isSelected
              ? "border-accent bg-accent/10 shadow-[0_0_12px_rgba(107,87,238,0.1)]"
              : "border-border hover:bg-surface-2 hover:border-border-strong"
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
        >
          <BackgroundPreview def={def} className="h-14 w-14 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text">
              {def.name}
            </div>
            <div className="line-clamp-2 text-[11px] text-text-muted">
              {def.description}
            </div>
          </div>
        </button>
        <button
          onClick={() => setView({ kind: "info", id: def.id })}
          aria-label={`${def.name} info`}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-text-muted transition-all duration-150 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
          style={{ borderRadius: "var(--radius-sm)", background: "var(--glass-2)", boxShadow: "var(--emboss-neutral)" }}
        >
          <InfoIcon size={14} />
        </button>
      </div>
    );
  };

  return (
    <aside className="flex w-full shrink-0 flex-col" style={{ background: "transparent" }}>
      {view.kind === "gallery" && (
        <>
          <Header title="Backgrounds" />
          <div className="scroll-thin flex flex-col gap-4 overflow-y-auto px-4 py-4">
            {/* Pause / Play control — affects the live canvas */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="text-xs text-text-muted">
                Background animations
              </span>
              <button
                onClick={onTogglePause}
                className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-text transition-all duration-150 hover:border-accent hover:text-accent btn-tactile"
              >
                {paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
                {paused ? "Play" : "Pause"}
              </button>
            </div>

            {/* None option */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Options
              </div>
              <button
                onClick={() => applyBackground(null)}
                className={`flex w-full items-center gap-3 rounded-lg border py-2 px-3 text-left transition-all duration-150 btn-tactile ${
                  currentSpec === null
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-surface-2 hover:border-border-strong"
                }`}
              >
                <div className="h-14 w-14 shrink-0 rounded-md bg-surface-2 flex items-center justify-center">
                  <span className="text-xs text-text-muted">None</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-text">
                    No background
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Use CSS background only
                  </div>
                </div>
              </button>
            </div>

            {/* Background list */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                React Bits ({backgrounds.length})
              </div>
              {backgrounds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-text-muted">
                  No backgrounds available yet
                </div>
              ) : (
                backgrounds.map((def, i) => (
                  <Row key={def.id} def={def} i={i} />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {view.kind === "info" && (() => {
        const def = byId(view.id);
        if (!def) return null;

        const isSelected = currentSpec?.id === def.id;

        return (
          <>
            <Header title={def.name} onBack={() => setView({ kind: "gallery" })} />
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {/* Live preview */}
              <LiveBackgroundPreview
                entry={byId(def.id)!}
                params={editedParams}
              />

              <p className="text-sm text-text-muted">{def.description}</p>

              {/* Pause / Play — shown when this background is applied */}
              {isSelected && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <span className="text-xs text-text-muted">Animation</span>
                  <button
                    onClick={onTogglePause}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-text transition-all duration-150 hover:border-accent hover:text-accent btn-tactile"
                  >
                    {paused ? <PlayIcon size={12} /> : <PauseIcon size={12} />}
                    {paused ? "Play" : "Pause"}
                  </button>
                </div>
              )}

              {/* Global Layer params — always visible when selected */}
              {isSelected && (
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Layer
                  </div>
                  <GlobalParamEditor
                    values={editedParams}
                    onChange={(params) => {
                      setEditedParams(params);
                      applyBackground(def.id, params);
                    }}
                  />
                </div>
              )}

              {/* Per-background params */}
              {isSelected && Object.keys(def.params).length > 0 && (
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Effect
                  </div>
                  <ParamEditor
                    def={def}
                    currentParams={editedParams}
                    onChange={(params) => {
                      setEditedParams(params);
                      applyBackground(def.id, params);
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => applyBackground(def.id)}
                className="self-start rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover transition-all duration-150 btn-tactile"
              >
                {isSelected ? "Update params" : "Use background"}
              </button>
            </div>
          </>
        );
      })()}
    </aside>
  );
}

/**
 * Memoized so the panel — and its live WebGL preview — doesn't re-render on
 * every streamed token during generation (App re-renders on each delta). The
 * parent passes a stable `html` string and `useCallback`-stabilized handlers,
 * so a streaming job elsewhere no longer churns this pane.
 */
export const BackgroundsPane = memo(BackgroundsPaneImpl);
