import { FONT_PATHS, WHITELISTED_FONTS } from "./constants";

/**
 * @font-face rules for the self-hosted whitelisted fonts, pointing at the
 * app's /fonts/ paths. Injected into both the live preview and the export
 * iframe so generated HTML renders with the real fonts even when the model
 * invents wrong font filenames.
 */
export const FONT_FACES: string = Object.entries(FONT_PATHS)
  .flatMap(([family, paths]) =>
    paths.map((path) => {
      const weight = path.match(/-(\d+)\.woff2$/)?.[1] ?? "400";
      return `@font-face { font-family: "${family}"; font-style: normal; font-weight: ${weight}; src: url("${path}") format("woff2"); font-display: swap; }`;
    }),
  )
  .join("\n");

/** Inject the self-hosted @font-face declarations into an HTML document.
 *  Strips any existing @font-face rules for whitelisted fonts (whether they
 *  use /fonts/ paths or base64 data URIs) to avoid duplicates and bloat. */
export function injectFontFaces(html: string): string {
  const cleaned = stripWhitelistedFontFaces(html);
  const tag = `<style>${FONT_FACES}</style>`;
  if (cleaned.includes("</head>")) return cleaned.replace("</head>", `${tag}</head>`);
  if (cleaned.includes("<body")) return cleaned.replace("<body", `${tag}<body`);
  return tag + cleaned;
}

/** Remove ALL @font-face rules that declare a whitelisted font family,
 *  regardless of whether they use /fonts/ paths or base64 data URIs. */
export function stripWhitelistedFontFaces(html: string): string {
  const familyPattern = WHITELISTED_FONTS.map((f) =>
    f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");
  const re = new RegExp(
    `@font-face\\s*\\{[^}]*font-family\\s*:\\s*(?:"(${familyPattern})"|'(${familyPattern})')[^}]*\\}`,
    "gi",
  );
  return html.replace(re, "");
}
