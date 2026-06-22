import { FONT_PATHS, WHITELISTED_FONTS } from "./constants";

const ALL_FONT_PATHS = Object.values(FONT_PATHS).flat();

export function sanitizeHTML(html: string): string {
  let result = html;

  // Remove <script> tags and their contents
  result = result.replace(/<script[\s\S]*?<\/script\s*>/gi, "");

  // Remove on* event attributes
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove javascript: URLs
  result = result.replace(
    /(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
    "",
  );

  // Remove elements with external src/href that aren't whitelisted font paths
  result = result.replace(
    /<(?:img|link|script|iframe|embed|object)\s[^>]*>/gi,
    (match) => {
      const isFontLink = ALL_FONT_PATHS.some((p) => match.includes(p));
      if (isFontLink) return match;

      const hasExternalRef =
        /(?:src|href)\s*=\s*(?:"https?:\/\/|'https?:\/\/)/i.test(match);
      if (hasExternalRef) return "";

      return match;
    },
  );

  // Remove <img> elements with empty src (causes render stalls in iframes)
  result = result.replace(
    /<img[^>]*\bsrc\s*=\s*(?:""|'')[^>]*>/gi,
    "",
  );
  // Clean up empty src attributes that remain on other elements
  result = result.replace(/\s+src\s*=\s*(?:""|'')/gi, "");

  // Remove @font-face rules for whitelisted fonts that use base64 data URIs.
  // The app re-injects these via injectFontFaces() — keeping duplicates bloats
  // the document (hundreds of KB of base64) and can crash html-to-image.
  result = stripBase64FontFaces(result);

  return result;
}

/**
 * Remove @font-face rules that declare a whitelisted font family AND use a
 * base64 data-URI source. These are redundant — the app provides its own
 * @font-face rules pointing at /fonts/ paths, which get inlined at export.
 */
export function stripBase64FontFaces(html: string): string {
  const familyPattern = WHITELISTED_FONTS.map((f) =>
    f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|");
  const re = new RegExp(
    `@font-face\\s*\\{[^}]*font-family\\s*:\\s*(?:"(${familyPattern})"|'(${familyPattern})')[^}]*url\\s*\\(\\s*data:[^)]+\\)[^}]*\\}`,
    "gi",
  );
  return html.replace(re, "");
}