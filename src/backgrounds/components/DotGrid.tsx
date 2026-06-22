'use client';

import { useEffect, useRef } from "react";
import type { BackgroundComponentProps } from "../types";
import RealDotGrid from "../real/DotGrid/DotGrid";

/**
 * Wrapper that adapts the React Bits DotGrid background
 * to the divsigner BackgroundComponentProps interface.
 * Source: https://github.com/DavidHDev/react-bits
 */
export default function DotGrid({
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
      <RealDotGrid {...(params as any)} />
    </div>
  );
}
