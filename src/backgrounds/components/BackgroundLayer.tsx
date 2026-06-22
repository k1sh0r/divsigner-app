import { memo, useMemo, useRef, useState, useEffect, Suspense } from "react";
import { parseBackgroundMeta } from "../parse";
import { getBackground, mergeParams } from "../catalog";
import { splitGlobalParams, DEFAULT_GLOBAL_PARAMS } from "../types";
import { BackgroundErrorBoundary } from "./BackgroundErrorBoundary";

interface BackgroundLayerProps {
  html: string;
  width: number;
  height: number;
  /** Called when canvas is ready for capture */
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  /** When true, the real component is unmounted and a frozen frame (or the
   *  backgroundColor) is shown instead.  Useful for pausing heavy / crashing
   *  backgrounds. */
  paused?: boolean;
}

/**
 * Renders the React Bits background behind the poster content.
 * Parses the background spec from the HTML meta tag and renders
 * the appropriate component.
 *
 * Wraps each background in an error boundary so a single broken
 * background never takes down the entire app.
 */
function BackgroundLayerImpl({
  html,
  width,
  height,
  onCanvasReady,
  paused = false,
}: BackgroundLayerProps) {
  // Parse spec synchronously to avoid flicker on html changes
  const { spec, Component, mergedParams } = useMemo(() => {
    const parsed = parseBackgroundMeta(html);
    if (!parsed) return { spec: null, Component: null, mergedParams: {} };
    const bgDef = getBackground(parsed.id);
    if (!bgDef) return { spec: null, Component: null, mergedParams: {} };
    return {
      spec: parsed,
      Component: bgDef.Component,
      mergedParams: mergeParams(bgDef, parsed.params),
    };
  }, [html]);

  // Split global layer params from per-background params
  const { globalParams, rest: componentParams } = useMemo(
    () => splitGlobalParams(mergedParams),
    [mergedParams],
  );

  const backgroundColor =
    globalParams.backgroundColor ?? DEFAULT_GLOBAL_PARAMS.backgroundColor;
  const opacity = globalParams.opacity ?? DEFAULT_GLOBAL_PARAMS.opacity;
  const blendMode = globalParams.blendMode ?? DEFAULT_GLOBAL_PARAMS.blendMode;
  const isOverlay = blendMode !== "normal";

  // Track the canvas element so we can snapshot it when pausing.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  const handleCanvasReady = (canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    onCanvasReady?.(canvas);
  };

  // When entering paused state, snapshot the current canvas frame.
  useEffect(() => {
    if (!paused) {
      setFrozenFrame(null);
      return;
    }
    let url: string | null = null;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        url = canvas.toDataURL("image/png");
        // Reject blank / tiny data URLs (e.g. 1×1 fallback)
        if (url && url.length < 100) url = null;
      } catch {
        url = null;
      }
    }
    setFrozenFrame(url);
  }, [paused]);

  if (!Component || !spec) {
    return null;
  }

  // The whole layer always sits BEHIND the poster content (which is zIndex 10
  // in PosterCanvas). `isOverlay` no longer changes stacking — the effect must
  // stay in the background; its blend mode now blends against the solid
  // background color beneath it rather than the content above.
  void isOverlay;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* Solid background color — the bottom-most layer, always behind the
          effect (and at full opacity) so it shows through transparent or
          partially-covered effects. */}
      <div style={{ position: "absolute", inset: 0, backgroundColor }} />

      {/* The effect, above the color. Opacity + blend mode apply here only, so
          they composite the effect against the color beneath — never the
          poster content. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
        }}
      >
        {paused ? (
          frozenFrame ? (
            <img
              src={frozenFrame}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : null
        ) : (
          <Suspense fallback={null}>
            <BackgroundErrorBoundary
              key={spec.id}
              backgroundColor={backgroundColor}
            >
              <Component
                width={width}
                height={height}
                params={componentParams}
                onCanvasReady={handleCanvasReady}
              />
            </BackgroundErrorBoundary>
          </Suspense>
        )}
      </div>
    </div>
  );
}

/**
 * Memoized so the heavy WebGL/Three backgrounds on finished slides don't
 * re-render on every streamed token (PosterCanvas re-renders on each delta).
 * Props (html, width, height, paused) are stable per slide, so a streaming job
 * elsewhere no longer churns — or stalls the animation of — these layers.
 */
export const BackgroundLayer = memo(BackgroundLayerImpl);