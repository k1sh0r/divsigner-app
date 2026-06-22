import { useEffect, useRef } from "react";
import type { BackgroundComponentProps } from "../types";
import RealDither from "../real/Dither/Dither";

/**
 * Wrapper that adapts the React Bits Dither background
 * to the divsigner BackgroundComponentProps interface.
 * Source: https://github.com/DavidHDev/react-bits
 */
export default function Dither({
  width,
  height,
  params,
  onCanvasReady,
}: BackgroundComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use MutationObserver to detect when a <canvas> element is mounted
    let canvasFound = false;
    const observer = new MutationObserver(() => {
      if (canvasFound) return;
      const canvas = container!.querySelector("canvas");
      if (canvas) {
        canvasFound = true;
        onCanvasReady?.(canvas);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    // Also check immediately in case canvas is already mounted
    const existing = container.querySelector("canvas");
    if (existing) {
      canvasFound = true;
      onCanvasReady?.(existing);
      observer.disconnect();
    }

    return () => {
      observer.disconnect();
    };
  }, [onCanvasReady]);

  // The real Dither expects waveColor as an [r, g, b] tuple (0–1), but the
  // param editor provides a hex/CSS color string. Convert it here so the
  // exposed `waveColor` control actually drives the shader.
  const resolved = { ...(params as Record<string, unknown>) };
  if (typeof resolved.waveColor === "string") {
    resolved.waveColor = hexToRgb01(resolved.waveColor);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
      }}
    >
      <RealDither {...(resolved as any)} />
    </div>
  );
}

/** Parse a #rrggbb / #rgb hex string into an [r, g, b] tuple normalized 0–1. */
function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [0.5, 0.5, 0.5];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
