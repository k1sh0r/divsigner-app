/**
 * True once `text` contains a complete HTML document — an opening
 * `<!doctype html>`/`<html …>` followed by a later `</html>`. Used to
 * early-terminate streaming: reasoning models often keep emitting
 * chain-of-thought AFTER the document is finished, which prolongs the stream
 * and raises interruption/timeout risk. Once this is true, the document is
 * complete and anything after it is noise we don't need.
 */
export function isCompleteHtmlDocument(text: string): boolean {
  const start = text.match(/<!doctype html|<html[\s>]/i);
  if (!start || start.index === undefined) return false;
  return text.toLowerCase().indexOf("</html>", start.index) !== -1;
}

export interface SplitResult {
  /** The extracted HTML document, or null if none was found. */
  html: string | null;
  /** Any non-HTML prose the model emitted alongside the document. */
  notes: string;
}

/**
 * Separate a model response into its HTML document and any surrounding prose
 * (commentary, explanations, leftover reasoning). The poster canvas renders
 * `html`; `notes` is shown in a separate pane so it never pollutes the design.
 *
 * Robust to truncated / incomplete output: if a model stream is cut off before
 * `</html>`, or emits only a fragment (a `<body>`, a styled `<div>`), we
 * recover the usable content and wrap it into a complete document rather than
 * failing with "No HTML document found". This dramatically reduces spurious
 * generation failures from timeouts and partial responses.
 *
 * Robust to "thinking" output: reasoning models wrap their chain-of-thought in
 * tags like `<thinking>`, `<think>`, `<reflection>`, `<reasoning>`, or
 * `<analysis>`. We strip ALL of these (including an unclosed one if the stream
 * was cut off mid-thought) and route them to `notes`. If the main answer has
 * no HTML, we ALSO search the stripped thinking text — some models route the
 * whole answer through the reasoning channel.
 */
export function splitHtml(raw: string): SplitResult {
  let text = raw ?? "";

  // Pull reasoning/thinking blocks out into notes rather than the document.
  // Handles both closed and unclosed (truncated) forms.
  const thinking: string[] = [];
  text = stripThinkingTags(text, thinking);

  // Prefer a fenced ``` block (any language) that contains an HTML document.
  const fenced = findFencedHtml(text);
  const haystack = fenced ?? text;

  // --- 1. Clean path: a complete document with matching open/close tags. ---
  const found = extractComplete(haystack);
  if (found) {
    const before = haystack.slice(0, found.anchorIndex).trim();
    const after = haystack
      .slice(found.anchorIndex + found.html.length)
      .trim();
    const notes = [thinking.join("\n\n"), before, after]
      .filter(Boolean)
      .join("\n\n")
      .replace(/```(?:[a-zA-Z]+)?/gi, "")
      .trim();
    return { html: found.html, notes };
  }

  // --- 2. Recovery path: partial / truncated HTML. Salvage what we can. ---
  const recovered = recoverPartialHtml(haystack);
  if (recovered) {
    const before = recovered.anchorIndex > 0
      ? haystack.slice(0, recovered.anchorIndex).trim()
      : "";
    const notes = [thinking.join("\n\n"), before]
      .filter(Boolean)
      .join("\n\n")
      .replace(/```(?:[a-zA-Z]+)?/gi, "")
      .trim();
    return { html: recovered.html, notes };
  }

  // --- 3. The answer had no HTML — try the thinking text as a last resort. ---
  if (thinking.length > 0) {
    const thinkHaystack = thinking.join("\n\n");
    const thinkFenced = findFencedHtml(thinkHaystack) ?? thinkHaystack;
    const thinkComplete = extractComplete(thinkFenced);
    const thinkRecovered =
      thinkComplete ?? recoverPartialHtml(thinkFenced);
    if (thinkComplete || thinkRecovered) {
      const html = (thinkComplete ?? thinkRecovered)!.html;
      const notes = raw
        .trim();
      return { html, notes };
    }
  }

  // --- 4. Nothing usable. ---
  const notes = [thinking.join("\n\n"), raw.trim()]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return { html: null, notes };
}

/** Tag names that wrap chain-of-thought / reasoning. All stripped to notes. */
const THINKING_TAGS = [
  "thinking",
  "think",
  "reflection",
  "reasoning",
  "analysis",
];

/** Remove every reasoning block (closed or unclosed/truncated) from `text`,
 *  pushing the inner text into `sink`. Returns the cleaned text. */
function stripThinkingTags(text: string, sink: string[]): string {
  let out = text;
  for (const tag of THINKING_TAGS) {
    // Closed form: <tag>…</tag>
    out = out.replace(
      new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi"),
      (_m, inner) => {
        sink.push(String(inner).trim());
        return "";
      },
    );
    // Unclosed form (stream cut off mid-thought): <tag>… with no closer.
    out = out.replace(
      new RegExp(`<${tag}>([\\s\\S]*)$`, "gi"),
      (_m, inner) => {
        sink.push(String(inner).trim());
        return "";
      },
    );
  }
  return out;
}

/** Find a fenced ``` block that contains an HTML document or a doctype.
 *  Returns the block contents, or null. */
function findFencedHtml(text: string): string | null {
  const matches = text.matchAll(/```(?:[a-zA-Z]+)?\s*([\s\S]*?)```/gi);
  for (const m of matches) {
    const body = m[1] ?? "";
    if (/<(?:!doctype html|html[\s>])/i.test(body)) return body;
  }
  // Unclosed fence (stream cut off): ```html … with no closing fence.
  const open = text.match(/```(?:[a-zA-Z]+)?\s*([\s\S]*)$/i);
  if (open) {
    const body = open[1] ?? "";
    if (/<(?:!doctype html|html[\s>])/i.test(body)) return body;
  }
  return null;
}

interface Located {
  html: string;
  /** Character index of the document start in the haystack. */
  anchorIndex: number;
}

/** Extract a complete `<!doctype…</html>` (or `<html>…</html>`) document.
 *  Returns null if no matching open+close pair is found. */
function extractComplete(haystack: string): Located | null {
  const startMatch = haystack.match(/<!doctype html|<html[\s>]/i);
  const endIdx = haystack.toLowerCase().lastIndexOf("</html>");
  const start = startMatch?.index ?? -1;

  if (start !== -1 && endIdx !== -1 && endIdx > start) {
    return {
      html: haystack.slice(start, endIdx + "</html>".length).trim(),
      anchorIndex: start,
    };
  }
  return null;
}

interface Recovery {
  html: string;
  /** Character index of the anchor we recovered from. */
  anchorIndex: number;
}

/** Try to recover a usable document from incomplete output. We look for the
 *  earliest strong structural anchor and wrap everything from there forward
 *  into a complete document. Returns null only when there's no recognizable
 *  HTML structure at all. */
function recoverPartialHtml(haystack: string): Recovery | null {
  // True when a fragment has enough substance to be worth recovering:
  // either it's long, or it contains at least one closing tag (so it's a
  // real element, not a stray opener).
  const isSubstantial = (frag: string) =>
    frag.length >= 30 ||
    /<\/(?:body|div|section|h[1-6]|p|span|ul|ol|li|table|main|article|header|footer)>/i.test(
      frag,
    );

  // Anchor candidates, in order of strength.
  const anchors: RegExp[] = [
    /<!doctype html/i,
    /<html[\s>]/i,
    /<head[\s>]/i,
    /<body[\s>]/i,
  ];

  for (const re of anchors) {
    const m = haystack.match(re);
    if (!m || m.index === undefined) continue;
    const fragment = haystack.slice(m.index);
    if (!isSubstantial(fragment)) continue;
    return { html: wrapFragment(fragment), anchorIndex: m.index };
  }

  // Last resort: a styled block-level element with real content (a poster
  // <div> with dimensions, or any <div>/<section> with a heading). This
  // catches models that emit a fragment with no document wrapper at all.
  const blockMatch = haystack.match(
    /<(?:div|section|main|article)\b[^>]*>[\s\S]*?<h[1-6]\b/i,
  );
  if (blockMatch && blockMatch.index !== undefined) {
    const fragment = haystack.slice(blockMatch.index);
    if (!isSubstantial(fragment)) return null;
    return { html: wrapFragment(fragment), anchorIndex: blockMatch.index };
  }

  return null;
}

/** Ensure the document ends with closing </body></html> even if truncated. */
function ensureClosedTags(doc: string): string {
  let out = doc;
  if (!/<\/body>/i.test(out) && /<body[\s>]/i.test(out)) out += "\n</body>";
  if (!/<\/html>/i.test(out)) out += "\n</html>";
  return out.trim();
}

/** Wrap a fragment of HTML into a complete document, closing open tags.
 *  Used to recover usable HTML from truncated output. */
function wrapFragment(inner: string): string {
  let doc = inner.trim();

  const hasDoctype = /<!doctype/i.test(doc);
  const hasHtmlOpen = /<html[\s>]/i.test(doc);
  const hasHead = /<head[\s>]/i.test(doc);
  const hasBody = /<body[\s>]/i.test(doc);

  // Strip a trailing unterminated tag (e.g. truncated "</html" or a
  // half-written attribute) so we never inject broken markup.
  doc = doc.replace(/<\/?\w*$/i, "");

  // Hoist stray <style>/<link>/<meta> into a <head> when one is missing.
  let headContent = "";
  if (!hasHead) {
    const headParts: string[] = [];
    doc = doc.replace(
      /<style[\s\S]*?<\/style>|<link\b[^>]*>|<meta\b[^>]*>/gi,
      (m) => {
        headParts.push(m);
        return "";
      },
    );
    headContent = headParts.join("\n");
  }

  // If the fragment already has a body/head, just ensure it's wrapped + closed.
  if (hasBody || hasHead || hasHtmlOpen) {
    let out = doc;
    if (!hasDoctype) out = `<!DOCTYPE html>\n` + out;
    if (!hasHtmlOpen) {
      out = out.replace(/(<!DOCTYPE[^>]*>\s*)/i, `$1<html lang="en">\n`);
    }
    if (!hasHead && headContent) {
      out = out.replace(
        /(<html[^>]*>\s*)/i,
        `$1<head>\n${headContent}\n</head>\n`,
      );
    }
    return ensureClosedTags(out);
  }

  // No structure at all — wrap the whole fragment as the body content.
  const headBlock = headContent ? `\n<head>\n${headContent}\n</head>` : "";
  return `<!DOCTYPE html>
<html lang="en">${headBlock}
<body>
${doc}
</body>
</html>`.trim();
}
