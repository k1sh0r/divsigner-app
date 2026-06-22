import type { BackgroundSpec } from "./types";

const META_NAME = "divsigner-background";

/** Store original bg so we can restore it when removing. */
const ORIGINAL_BG_COMMENT = "/* divsigner-original-bg */";

/**
 * Extract background spec from HTML meta tag.
 * Returns null if no background meta tag found.
 */
export function parseBackgroundMeta(html: string): BackgroundSpec | null {
  // Match <meta name="divsigner-background" content='...' />
  // serializeBackgroundMeta uses single-quoted content (JSON uses double quotes),
  // but we also handle double-quoted content as a fallback.
  const namePattern = `name\\s*=\\s*["']${META_NAME}["']`;

  // Try name-then-content with single-quoted content (JSON-safe)
  const m1 = html.match(
    new RegExp(
      `<meta[^>]*${namePattern}[^>]*content\\s*=\\s*'([^']+)'`,
      "i",
    ),
  );
  if (m1?.[1]) {
    try {
      return JSON.parse(m1[1]) as BackgroundSpec;
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Try name-then-content with double-quoted content
  const m2 = html.match(
    new RegExp(
      `<meta[^>]*${namePattern}[^>]*content\\s*=\\s*"([^"]+)"`,
      "i",
    ),
  );
  if (m2?.[1]) {
    try {
      return JSON.parse(m2[1]) as BackgroundSpec;
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Try reverse order (content before name) with single quotes
  const m3 = html.match(
    new RegExp(
      `<meta[^>]*content\\s*=\\s*'([^']+)'[^>]*${namePattern}`,
      "i",
    ),
  );
  if (m3?.[1]) {
    try {
      return JSON.parse(m3[1]) as BackgroundSpec;
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Try reverse order with double quotes
  const m4 = html.match(
    new RegExp(
      `<meta[^>]*content\\s*=\\s*"([^"]+)"[^>]*${namePattern}`,
      "i",
    ),
  );
  if (m4?.[1]) {
    try {
      return JSON.parse(m4[1]) as BackgroundSpec;
    } catch {
      // Invalid JSON, ignore
    }
  }

  return null;
}

/**
 * Serialize background spec to meta tag HTML string.
 */
export function serializeBackgroundMeta(spec: BackgroundSpec): string {
  const json = JSON.stringify(spec);
  return `<meta name="${META_NAME}" content='${json}' />`;
}

/**
 * Inject or update background meta tag in HTML.
 * Removes any existing divsigner-background meta tags first.
 */
export function injectBackgroundMeta(
  html: string,
  spec: BackgroundSpec | null,
): string {
  // Remove existing meta tags
  const cleaned = html.replace(
    new RegExp(`<meta[^>]*name\\s*=\\s*["']${META_NAME}["'][^>]*\\/?>`, "gi"),
    "",
  );

  if (!spec) return cleaned;

  const metaTag = serializeBackgroundMeta(spec);

  // Insert before </head> if present, otherwise at start
  if (cleaned.includes("</head>")) {
    return cleaned.replace("</head>", `${metaTag}\n</head>`);
  }

  // No </head>, try before <body>
  if (cleaned.includes("<body")) {
    return cleaned.replace("<body", `${metaTag}\n<body`);
  }

  // Fallback: prepend to document
  return metaTag + "\n" + cleaned;
}

/**
 * Remove background meta tag from HTML.
 */
export function removeBackgroundMeta(html: string): string {
  return html.replace(
    new RegExp(`<meta[^>]*name\\s*=\\s*["']${META_NAME}["'][^>]*\\/?>\\s*`, "gi"),
    "",
  );
}

/**
 * Extract the current background from the HTML's body or root element.
 * Handles both CSS rules in <style> tags and inline style attributes.
 * Returns a JSON object with sources for restoration.
 */
function extractCurrentBackground(html: string): {
  bodyStyleAttr: string | null;
  wrapperStyleAttr: string | null;
  cssRule: string | null;
} {
  const result = {
    bodyStyleAttr: null as string | null,
    wrapperStyleAttr: null as string | null,
    cssRule: null as string | null,
  };

  // 1. Check inline style on <body> tag
  const bodyTagMatch = html.match(/<body[^>]*style\s*=\s*"([^"]+)"[^>]*>/i);
  if (bodyTagMatch) {
    const bgMatch = bodyTagMatch[1]!.match(/background(?:-color)?\s*:[^;]+/i);
    if (bgMatch) result.bodyStyleAttr = bgMatch[0];
  }
  // Also try single quotes
  if (!result.bodyStyleAttr) {
    const bodyTagMatch2 = html.match(/<body[^>]*style\s*=\s*'([^']+)'[^>]*>/i);
    if (bodyTagMatch2) {
      const bgMatch = bodyTagMatch2[1]!.match(/background(?:-color)?\s*:[^;]+/i);
      if (bgMatch) result.bodyStyleAttr = bgMatch[0];
    }
  }

  // 2. Check inline style on first child of body (wrapper div)
  // Look for a div/section/main immediately after <body...>
  const bodyEndMatch = html.match(/<body[^>]*>/i);
  if (bodyEndMatch) {
    const afterBody = html.slice(html.indexOf(bodyEndMatch[0]) + bodyEndMatch[0].length);
    // Match first element with style attribute
    const wrapperMatch = afterBody.match(
      /^\s*<(div|section|main|article)[^>]*style\s*=\s*"([^"]+)"[^>]*>/i,
    );
    if (wrapperMatch) {
      const bgMatch = wrapperMatch[2]!.match(/background(?:-color)?\s*:[^;]+/i);
      if (bgMatch) result.wrapperStyleAttr = bgMatch[0];
    }
    // Try single quotes
    if (!result.wrapperStyleAttr) {
      const wrapperMatch2 = afterBody.match(
        /^\s*<(div|section|main|article)[^>]*style\s*=\s*'([^']+)'[^>]*>/i,
      );
      if (wrapperMatch2) {
        const bgMatch = wrapperMatch2[2]!.match(/background(?:-color)?\s*:[^;]+/i);
        if (bgMatch) result.wrapperStyleAttr = bgMatch[0];
      }
    }
  }

  // 3. Check CSS rules in <style> tags for body/html
  const styleMatches = html.match(/<style[^>]*>(.*?)<\/style>/gis);
  if (styleMatches) {
    for (const block of styleMatches) {
      const content = block.replace(/<\/?style[^>]*>/gi, "");
      // Match body { ... background: ... }
      const bodyMatch = content.match(
        /body\s*\{[^}]*(?:background(?:-color)?\s*:[^;}]+)/i,
      );
      if (bodyMatch) {
        result.cssRule = bodyMatch[0];
        break;
      }
      // Match html { ... background: ... }
      const htmlMatch = content.match(
        /html\s*\{[^}]*(?:background(?:-color)?\s*:[^;}]+)/i,
      );
      if (htmlMatch) {
        result.cssRule = htmlMatch[0];
        break;
      }
    }
  }

  return result;
}

/**
 * Make the HTML document's body/root background transparent so
 * the React background layer shows through the iframe.
 * Handles inline styles on body, wrapper div, and CSS rules.
 * Stores the original bg values in a comment so they can be restored.
 */
export function makeBackgroundTransparent(html: string): string {
  // Skip if already transparent
  if (html.includes("divsigner-bg-transparent")) return html;

  const originalBg = extractCurrentBackground(html);
  const hasOriginalBg =
    originalBg.bodyStyleAttr ||
    originalBg.wrapperStyleAttr ||
    originalBg.cssRule;

  const savedOriginal = hasOriginalBg
    ? `${ORIGINAL_BG_COMMENT}${JSON.stringify(originalBg)}${ORIGINAL_BG_COMMENT}`
    : `${ORIGINAL_BG_COMMENT}null${ORIGINAL_BG_COMMENT}`;

  // CSS rule to make body/html and first child transparent
  // The !important ensures it overrides inline styles
  const transparentRule = `
    html, body { background: transparent !important; background-color: transparent !important; }
    body > *:first-child { background: transparent !important; background-color: transparent !important; }
  `;
  const marker = "divsigner-bg-transparent";
  const injectStyle = `<style id="${marker}">${savedOriginal}${transparentRule}</style>`;

  // Also modify inline style on body tag if present
  let modified = html;
  const bodyTagMatch = modified.match(/(<body[^>]*style\s*=\s*["'])([^"']*)(["'])/i);
  if (bodyTagMatch) {
    const existingStyle = bodyTagMatch[2]!;
    // Add background:transparent to existing style, preserving other properties
    const newStyle = existingStyle.includes("background")
      ? existingStyle.replace(/background(?:-color)?\s*:[^;]+;?/gi, "background:transparent!important;")
      : `${existingStyle};background:transparent!important;`;
    modified = modified.replace(
      bodyTagMatch[0]!,
      `${bodyTagMatch[1]!}${newStyle}${bodyTagMatch[3]!}`
    );
  }

  // Insert the transparent style before </head>
  if (modified.includes("</head>")) {
    return modified.replace("</head>", `${injectStyle}\n</head>`);
  }
  // Insert before <body>
  if (modified.includes("<body")) {
    return modified.replace("<body", `${injectStyle}\n<body`);
  }
  // Fallback: prepend to document
  return injectStyle + "\n" + modified;
}

/**
 * Restore the original body/root background that was saved when
 * making it transparent. Also removes the injected transparent style.
 */
export function restoreOriginalBackground(html: string): string {
  // Remove the injected transparent style block
  let cleaned = html.replace(
    /<style[^>]*id\s*=\s*["']divsigner-bg-transparent["'][^>]*>.*?<\/style>\s*/gis,
    "",
  );

  // Extract saved original bg values
  const commentRegex = new RegExp(
    `${ORIGINAL_BG_COMMENT.replace(/[\/*]/g, (c) => `\\${c}`)}(.+?)${ORIGINAL_BG_COMMENT.replace(/[\/*]/g, (c) => `\\${c}`)}`,
  );
  const savedMatch = cleaned.match(commentRegex);
  if (savedMatch) {
    const savedValue = savedMatch[1]!;
    // Remove the saved comment from HTML
    cleaned = cleaned.replace(savedMatch[0], "");

    if (savedValue !== "null") {
      try {
        const originalBg = JSON.parse(savedValue) as {
          bodyStyleAttr: string | null;
          wrapperStyleAttr: string | null;
          cssRule: string | null;
        };

        // Restore inline style on body tag — replace our override with the
        // original value so the background is restored
        if (originalBg.bodyStyleAttr) {
          cleaned = cleaned.replace(
            /background:\s*transparent\s*!important\s*;?/gi,
            originalBg.bodyStyleAttr + ";",
          );
        } else {
          // No original body inline bg — just remove our override
          cleaned = cleaned.replace(
            /background:\s*transparent\s*!important\s*;?/gi,
            "",
          );
        }

        // CSS rule restoration: the original <style> block still has the
        // body/html background rule — it was just overridden by our !important.
        // Removing our injected <style> is sufficient to restore it.
      } catch {
        // Malformed saved data, clean up as best we can
        cleaned = cleaned.replace(
          /background:\s*transparent\s*!important\s*;?/gi,
          "",
        );
      }
    } else {
      // No original bg was saved — just clean up our override
      cleaned = cleaned.replace(
        /background:\s*transparent\s*!important\s*;?/gi,
        "",
      );
    }
  } else {
    // No saved comment found — clean up any leftover overrides
    cleaned = cleaned.replace(
      /background:\s*transparent\s*!important\s*;?/gi,
      "",
    );
  }

  return cleaned;
}
