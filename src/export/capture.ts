import { toPng } from "html-to-image";
import { EXPORT_PIXEL_RATIO } from "../utils/constants";

/**
 * Attempt a toPng capture with retries. html-to-image can fail on large
 * documents with base64 fonts due to memory pressure or timing.
 */
async function captureWithRetry(
  node: HTMLElement,
  options: Parameters<typeof toPng>[1],
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

export async function capturePNG(
  node: HTMLElement,
  fontEmbedCSS: string,
): Promise<string> {
  await document.fonts.ready;

  const dataUrl = await captureWithRetry(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    fontEmbedCSS,
    skipFonts: true,
  });

  return dataUrl;
}