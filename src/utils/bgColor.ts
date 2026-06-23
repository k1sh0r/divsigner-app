/**
 * Read/write a poster's background color + opacity in its HTML.
 *
 * The color is stored as `background: rgba(r,g,b,a)` on the poster's root
 * background element. `writeBgColor` sets/replaces the `background` declaration
 * in that element's `style` attribute (creating `style` if absent; preserving
 * other declarations). `readBgColor` parses it back to `{ hex, opacity }`.
 *
 * Target selection: prefer the `<body>` tag; if the generated HTML is a
 * fragment with no `<body>`, fall back to the first top-level element; if none
 * exists, wrap the content so the color still applies.
 *
 * Uses regex/string ops only (no DOM) so it runs under jsdom and SSR-free.
 */

export interface BgColor {
  /** Uppercase 6-digit hex, no `#`. */
  hex: string;
  /** 0–100. */
  opacity: number;
}

const DEFAULT: BgColor = { hex: "FFFFFF", opacity: 100 };

const DQ = '"';
const SQ = "'";

/** Parse a hex (#rgb or #rrggbb) to [r,g,b]. Returns null if not hex. */
function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Parse `rgba(r,g,b,a)` / `rgb(r,g,b)` to {rgb, opacity}. */
function parseRgba(str: string): { rgb: [number, number, number]; opacity: number } | null {
  const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (!m) return null;
  const rgb: [number, number, number] = [
    Math.round(parseFloat(m[1]!)),
    Math.round(parseFloat(m[2]!)),
    Math.round(parseFloat(m[3]!)),
  ];
  const opacity = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 100) : 100;
  return { rgb, opacity };
}

function rgbToHex(rgb: [number, number, number]): string {
  return rgb
    .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0").toUpperCase())
    .join("");
}

/** Extract the `background` value from a style attribute string. */
function extractBackground(style: string): string | null {
  const bg = style.match(/(?:^|;)\s*background\s*:\s*([^;]+)/i);
  if (bg) return bg[1]!.trim();
  const bgc = style.match(/(?:^|;)\s*background-color\s*:\s*([^;]+)/i);
  return bgc ? bgc[1]!.trim() : null;
}

/** Parse a background CSS value into { hex, opacity }. */
function parseBgValue(value: string): BgColor | null {
  const v = value.trim();
  const rgba = parseRgba(v);
  if (rgba) return { hex: rgbToHex(rgba.rgb), opacity: rgba.opacity };
  const hex = parseHex(v);
  if (hex) return { hex: rgbToHex(hex), opacity: 100 };
  return null;
}

interface TagMatch {
  fullTag: string;
  tagIndex: number;
  styleValue: string | null;
  styleAttrIndex: number;
  styleAttrLength: number;
  quote: string | null;
}

function findStyleAttr(tag: string): {
  styleValue: string | null;
  styleAttrIndex: number;
  styleAttrLength: number;
  quote: string | null;
} {
  // Match optional leading whitespace + `style="..."` / `style='...'`.
  // The leading whitespace is part of the matched span so it is preserved
  // when the attribute is replaced.
  const re = /(\s)style\s*=\s*("([^"]*)"|'([^']*)')/i;
  const m = tag.match(re);
  if (!m) return { styleValue: null, styleAttrIndex: -1, styleAttrLength: 0, quote: null };
  const dq = m[3];
  const quote = dq !== undefined ? DQ : SQ;
  const styleValue = dq !== undefined ? dq : m[4] ?? "";
  return {
    styleValue,
    styleAttrIndex: m.index!,
    styleAttrLength: m[0].length,
    quote,
  };
}

function findTargetTag(html: string): TagMatch | null {
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  if (bodyMatch) {
    const fullTag = bodyMatch[0];
    const tagIndex = bodyMatch.index!;
    const s = findStyleAttr(fullTag);
    return {
      fullTag,
      tagIndex,
      styleValue: s.styleValue,
      styleAttrIndex: s.styleAttrIndex,
      styleAttrLength: s.styleAttrLength,
      quote: s.quote,
    };
  }
  const trimmed = html.trimStart();
  const lead = html.length - trimmed.length;
  const elMatch = trimmed.match(/^<([a-zA-Z][\w-]*)\b[^>]*>/);
  if (elMatch) {
    const fullTag = elMatch[0];
    const tagIndex = lead + elMatch.index!;
    const s = findStyleAttr(fullTag);
    return {
      fullTag,
      tagIndex,
      styleValue: s.styleValue,
      styleAttrIndex: s.styleAttrIndex,
      styleAttrLength: s.styleAttrLength,
      quote: s.quote,
    };
  }
  return null;
}

export function readBgColor(html: string): BgColor {
  const tag = findTargetTag(html);
  if (!tag || !tag.styleValue) return DEFAULT;
  const bg = extractBackground(tag.styleValue);
  if (!bg) return DEFAULT;
  return parseBgValue(bg) ?? DEFAULT;
}

export function writeBgColor(html: string, hex: string, opacity: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return html; // invalid hex — leave unchanged
  const a = Math.max(0, Math.min(100, opacity)) / 100;
  const bgDecl = `background:rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

  const tag = findTargetTag(html);

  // No target element: wrap the content in a div carrying the background.
  if (!tag) {
    return `<div style=${DQ}${bgDecl}${DQ}>${html}</div>`;
  }

  // No style attribute: add one before the closing `>` of the tag.
  if (tag.styleValue === null) {
    const closeIdx = tag.fullTag.lastIndexOf(">");
    const newTag =
      tag.fullTag.slice(0, closeIdx) +
      ` style=${DQ}${bgDecl}${DQ}` +
      tag.fullTag.slice(closeIdx);
    return (
      html.slice(0, tag.tagIndex) + newTag + html.slice(tag.tagIndex + tag.fullTag.length)
    );
  }

  // Has a style attribute: replace or append the background declaration.
  const styleValue = tag.styleValue;
  const existingBg = extractBackground(styleValue);
  let newStyle: string;
  if (existingBg) {
    newStyle = styleValue.replace(
      /((?:^|;)\s*)(background(?:-color)?\s*:\s*[^;]+)/i,
      (_m, lead: string) => `${lead}${bgDecl}`,
    );
  } else {
    const sep = styleValue.trim().endsWith(";") || styleValue.trim() === "" ? "" : ";";
    newStyle = `${styleValue}${sep}${bgDecl}`;
  }

  const quote = tag.quote ?? DQ;
  const styleStart = tag.tagIndex + tag.styleAttrIndex;
  const styleEnd = styleStart + tag.styleAttrLength;
  // Preserve the leading whitespace that was part of the matched span.
  const leadWs = tag.fullTag.slice(tag.styleAttrIndex, tag.styleAttrIndex + 1);
  return (
    html.slice(0, styleStart) +
    leadWs +
    `style=${quote}${newStyle}${quote}` +
    html.slice(styleEnd)
  );
}