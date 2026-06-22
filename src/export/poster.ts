import React from "react";
import { toPng } from "html-to-image";
import { downloadDataUrl, downloadText } from "./download";
import { injectFontFaces } from "../utils/fontFaces";
import { parseBackgroundMeta } from "../backgrounds/parse";
import { getBackground, mergeParams } from "../backgrounds/catalog";
import { splitGlobalParams, DEFAULT_GLOBAL_PARAMS } from "../backgrounds/types";
import { BackgroundErrorBoundary } from "../backgrounds/components/BackgroundErrorBoundary";
import type { BackgroundSpec, GlobalLayerParams } from "../backgrounds/types";
import type { AspectRatioKey } from "../utils/constants";
import {
  ASPECT_RATIOS,
  EXPORT_PIXEL_RATIO,
  FONT_PATHS,
  WHITELISTED_FONTS,
} from "../utils/constants";

/**
 * Wait until fonts are truly loaded inside an iframe by polling
 * document.fonts.ready and then verifying a layout reflow has occurred.
 * Large base64 fonts can report ready before the browser has fully decoded
 * them, so we add a settling delay that scales with font count.
 */
async function waitForFontsReady(
  win: Window | null,
  extraSettleMs = 250,
): Promise<void> {
  if (!win) return;
  try {
    await win.document.fonts.ready;
  } catch {
    /* ignore */
  }
  // Force a layout reflow so the browser commits font metrics.
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    win.document.documentElement.offsetHeight;
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, extraSettleMs));
}

/**
 * Attempt a toPng capture with retries. html-to-image can fail on large
 * documents with base64 fonts due to memory pressure or timing — a retry
 * after a short delay often succeeds once the GC has freed transient data.
 */
async function captureWithRetry(
  node: HTMLElement,
  options: Parameters<typeof toPng>[1] & { width: number; height: number },
  maxRetries = 2,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await toPng(node, options);
      // toPng can return a blank 1×1 data URL on failure — detect that.
      if (result && result.length > 1000) return result;
      throw new Error("toPng returned an empty image");
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/**
 * Render the poster HTML in an offscreen iframe and rasterize it.
 *
 * We capture from a real iframe (the same mechanism as the live preview)
 * rather than reconstructing a <style> + <div> container — html-to-image
 * does not reliably apply rules from a standalone <style> element, which
 * produced fully transparent (blank) PNGs.
 */
async function renderInIframe<T>(
  html: string,
  dims: { width: number; height: number },
  capture: (doc: Document) => Promise<T>,
): Promise<T> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${dims.width}px;height:${dims.height}px;border:0;`;
  document.body.appendChild(iframe);

  try {
    // injectFontFaces strips existing @font-face for whitelisted fonts
    // (including base64 data URIs) before injecting the /fonts/ versions.
    const prepared = injectFontFaces(html);
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = prepared;
    });
    const doc = iframe.contentDocument!;
    // Wait for fonts to fully load and layout to settle.
    await waitForFontsReady(iframe.contentWindow, 250);
    return await capture(doc);
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Minimal React ErrorBoundary class for use in offscreen renders.
 * Catches render/effect errors so the export can fall back gracefully.
 */
class ExportErrorBoundary extends React.Component<
  { children?: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Capture a background component to a data URL.
 * Creates an offscreen React render and captures the canvas.
 * For WebGL canvases, reads during a requestAnimationFrame callback
 * to avoid preserveDrawingBuffer issues.
 */
async function captureBackgroundLayer(
  spec: BackgroundSpec,
  width: number,
  height: number,
): Promise<{ url: string | null; globalParams: GlobalLayerParams }> {
  const bgDef = getBackground(spec.id);
  if (!bgDef) return { url: null, globalParams: DEFAULT_GLOBAL_PARAMS };

  const mergedParams = mergeParams(bgDef, spec.params);
  const { globalParams, rest: componentParams } = splitGlobalParams(mergedParams);

  // Render at export resolution for all component types.
  // WebGL (ogl/three) render at exactly the passed dims — needs pre-multiply.
  // Canvas2D components apply their own DPR internally; on retina this gives
  // 2x (matching EXPORT_PIXEL_RATIO), but on non-retina only 1x. Passing
  // export dims ensures correct resolution regardless of device DPR.
  const renderW = width * EXPORT_PIXEL_RATIO;
  const renderH = height * EXPORT_PIXEL_RATIO;
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: -99999px;
    left: -99999px;
    width: ${renderW}px;
    height: ${renderH}px;
    pointer-events: none;
  `;
  document.body.appendChild(container);

  try {
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");

    let canvasEl: HTMLCanvasElement | null = null;
    let resolveCapture: ((url: string) => void) | null = null;
    const capturePromise = new Promise<string>((resolve) => {
      resolveCapture = resolve;
    });

    const Component = bgDef.Component;
    const root = createRoot(container);

    // Wrap in an error boundary so a crashing component doesn't break the export.
    root.render(
      React.createElement(
        ExportErrorBoundary,
        { fallback: null },
        React.createElement(
          React.Suspense,
          { fallback: null },
          React.createElement(
            BackgroundErrorBoundary,
            { backgroundColor: globalParams.backgroundColor },
            React.createElement(Component, {
              width: renderW,
              height: renderH,
              params: componentParams,
              onCanvasReady: (canvas: HTMLCanvasElement | null) => {
                if (canvas) canvasEl = canvas;
              },
            }),
          ),
        ),
      ),
    );

    // Wait for component to mount and render
    await new Promise((r) => setTimeout(r, 150));

    // If we got a canvas via onCanvasReady, capture it in a rAF
    // to get a valid frame (important for WebGL without preserveDrawingBuffer)
    if (canvasEl) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              const url = canvasEl!.toDataURL("image/png");
              resolveCapture!(url);
            } catch {
              // WebGL capture failed, try html-to-image fallback
              try {
                toPng(container, { width: renderW, height: renderH, pixelRatio: 1 }).then((url) => {
                  resolveCapture!(url);
                }).catch(() => {
                  resolveCapture!("");
                });
              } catch {
                resolveCapture!("");
              }
            }
            resolve();
          });
        });
      });

      const dataUrl = await capturePromise;
      root.unmount();
      return { url: dataUrl || null, globalParams };
    }

    // No canvas ref — fallback: capture container with html-to-image
    const url = await toPng(container, { width: renderW, height: renderH, pixelRatio: 1 });
    root.unmount();
    return { url, globalParams };
  } finally {
    document.body.removeChild(container);
  }
}

/** Map a CSS mix-blend-mode string to a canvas globalCompositeOperation. */
function mapBlendMode(mode: string): GlobalCompositeOperation {
  const map: Record<string, GlobalCompositeOperation> = {
    normal: "source-over",
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
    darken: "darken",
    lighten: "lighten",
    "color-dodge": "color-dodge",
    "color-burn": "color-burn",
    "hard-light": "hard-light",
    "soft-light": "soft-light",
    difference: "difference",
    exclusion: "exclusion",
    hue: "hue",
    saturation: "saturation",
    color: "color",
    luminosity: "luminosity",
  };
  return map[mode] ?? "source-over";
}

/**
 * Composite background and foreground images with global layer params
 * (backgroundColor, opacity, blendMode).
 */
async function compositeLayers(
  bgDataUrl: string | null,
  fgDataUrl: string,
  width: number,
  height: number,
  gp: GlobalLayerParams,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Layer order matches the live preview (BackgroundLayer):
  //   1. solid background color (bottom)
  //   2. effect — blended against the color beneath, with opacity
  //   3. poster content (always on top)
  ctx.fillStyle = gp.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (bgDataUrl) {
    try {
      const bgImg = await loadImage(bgDataUrl);
      ctx.globalCompositeOperation =
        gp.blendMode === "normal" ? "source-over" : mapBlendMode(gp.blendMode);
      ctx.globalAlpha = gp.opacity;
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    } catch {
      /* continue without bg */
    }
  }

  const fgImg = await loadImage(fgDataUrl);
  ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

/** Rasterize the poster HTML to a downloaded PNG (only on user request). */
export async function exportPng(
  html: string,
  aspectRatio: AspectRatioKey,
  fontEmbedCSS: string,
): Promise<void> {
  const dims = ASPECT_RATIOS[aspectRatio];
  const spec = parseBackgroundMeta(html);

  // Capture HTML layer
  const htmlDataUrl = await renderInIframe(html, dims, async (doc) => {
    await document.fonts.ready;
    return captureWithRetry(doc.documentElement, {
      width: dims.width,
      height: dims.height,
      pixelRatio: EXPORT_PIXEL_RATIO,
      fontEmbedCSS,
      skipFonts: true,
    });
  });

  if (!spec) {
    // No background, download HTML capture directly
    downloadDataUrl(htmlDataUrl, `poster-${aspectRatio.replace(":", "x")}.png`);
    return;
  }

  // Capture background layer at export resolution (returns {url, globalParams})
  const { url: bgDataUrl, globalParams } = await captureBackgroundLayer(
    spec,
    dims.width,
    dims.height,
  );

  if (!bgDataUrl) {
    // Background capture failed, fall back to HTML-only export
    downloadDataUrl(htmlDataUrl, `poster-${aspectRatio.replace(":", "x")}.png`);
    return;
  }

  // Composite: apply backgroundColor, opacity, and blendMode from the layer params
  const compositeDataUrl = await compositeLayers(
    bgDataUrl,
    htmlDataUrl,
    dims.width * EXPORT_PIXEL_RATIO,
    dims.height * EXPORT_PIXEL_RATIO,
    globalParams,
  );
  downloadDataUrl(compositeDataUrl, `poster-${aspectRatio.replace(":", "x")}.png`);
}

async function embedFontsInHTML(html: string): Promise<string> {
  const fontCache = new Map<string, string>();
  for (const fontFamily of WHITELISTED_FONTS) {
    const paths = FONT_PATHS[fontFamily] ?? [];
    for (const path of paths) {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        fontCache.set(path, base64);
      } catch {
        // skip missing fonts
      }
    }
  }
  let result = html;
  for (const [path, base64] of fontCache) {
    result = result.replace(
      new RegExp(
        `url\\(['"]?${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]?\\)`,
        "g",
      ),
      `url(${base64})`,
    );
  }
  return result;
}

/** Download the editable HTML source with our fonts inlined as base64. */
export async function downloadHtml(
  html: string,
  aspectRatio: AspectRatioKey,
): Promise<void> {
  const name = `poster-${aspectRatio.replace(":", "x")}.html`;
  try {
    // Ensure our self-hosted @font-face rules are present, then inline them.
    const embedded = await embedFontsInHTML(injectFontFaces(html));
    downloadText(embedded, name, "text/html");
  } catch {
    downloadText(html, name, "text/html");
  }
}