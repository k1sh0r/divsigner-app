import type { Style } from "./types";
import { ASPECT_RATIOS, WHITELISTED_FONTS } from "../utils/constants";
import type { AspectRatioKey } from "../utils/constants";
import { BACKGROUND_CATALOG } from "../backgrounds/catalog";

const UNIVERSAL_GROUNDING = `
UNIVERSAL DESIGN RULES (apply within the chosen style, never overriding it):
- Clear visual hierarchy: the most important message reads first.
- At most 2 type families; let weight/size/case/spacing carry the design.
- Keep text legible against its background.
- Compose intentionally on a grid; every element earns its place.
- Commit fully to the chosen style — avoid generic, default, or templated layouts.
`;

const HARD_CONSTRAINTS_TEMPLATE = `
HARD CONSTRAINTS:
1. Output exactly ONE self-contained HTML document (<!doctype html>...</html>).
2. Canvas must be exactly {WIDTH}px × {HEIGHT}px — set html, body, and root container to these dimensions.
3. Use ONLY these whitelisted fonts: ${WHITELISTED_FONTS.join(", ")}. No other font families.
4. All CSS must be inline (in a <style> tag inside the HTML). No external stylesheets.
5. No <script> tags. No JavaScript. No external resources except whitelisted fonts from /fonts/ path.
6. No remote images, no CDN links, no external assets of any kind.
7. Use @font-face declarations referencing /fonts/ paths for font loading.
8. The HTML must render correctly when opened standalone in a browser.
9. Do NOT use any CSS features that require JavaScript.
10. All colors must be valid CSS color values.
`;

const OUTPUT_DIRECTIVE = `
OUTPUT — CRITICAL (prevents timeouts):
- Do NOT think, reason, analyze, plan, or explain. Skip ALL chain-of-thought.
- Begin outputting HTML IMMEDIATELY, with the very first token being "<" of <!DOCTYPE html>.
- Do NOT wrap the code in markdown fences (no \`\`\`html).
- Do NOT write any prose before or after the document. No commentary, no "Here is...", no explanation.
- End the document with exactly "</html>" and then stop.
- Be efficient: every line must be part of the final HTML. No filler, no repetition.
`;

/** A prebuilt HTML scaffold the model fills in instead of generating the
 *  document structure from scratch. This makes output reliable (always starts
 *  with <!DOCTYPE html>, always ends with </html>, dimensions enforced) and
 *  lets the model spend its token budget on the design, not on boilerplate —
 *  which reduces both timeouts and malformed/unclosed documents. */
function buildHtmlScaffold(
  width: number,
  height: number,
  bodyFont: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  /* Canvas reset — do not change the dimensions */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  body { font-family: "${bodyFont}", sans-serif; }
  .poster {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
  }

  /* === ADD YOUR STYLES BELOW === */

</style>
</head>
<body>
  <div class="poster">
    <!-- === ADD YOUR POSTER CONTENT BELOW === -->

  </div>
</body>
</html>`;
}

export function buildSystemPrompt(
  style: Style,
  aspectRatio: AspectRatioKey,
  hasReferenceImage = false,
): string {
  const dims = ASPECT_RATIOS[aspectRatio];
  const constraints = HARD_CONSTRAINTS_TEMPLATE
    .replace("{WIDTH}", String(dims.width))
    .replace("{HEIGHT}", String(dims.height));

  const referenceNote = hasReferenceImage
    ? `\nREFERENCE IMAGE: Use the attached image as visual reference for layout, mood, palette, and composition — recreate its design language with code (do NOT embed or link the image; reproduce the look with CSS/typography).\n`
    : "";

  const styleBlock =
    style.source === "custom" && style.designMd
      ? `STYLE: "${style.name}". Follow this design language precisely.\n\nSTYLE GUIDE (design.md):\n${style.designMd}`
      : builtinStyleBlock(style);

  const bodyFont = style.tokens?.bodyFont ?? "Inter";
  const scaffold = buildHtmlScaffold(dims.width, dims.height, bodyFont);

  return `${styleBlock}
${referenceNote}

${UNIVERSAL_GROUNDING}

${constraints}
${OUTPUT_DIRECTIVE}

START FROM THIS SCAFFOLD — keep the <!DOCTYPE html>, <html>, <head>, and <body> structure, keep the canvas dimensions, then REPLACE the placeholder CSS and content inside .poster with your design. Output the COMPLETE filled-in document:

${scaffold}`;
}

function buildBackgroundCatalogDescription(): string {
  const backgrounds = BACKGROUND_CATALOG;
  if (backgrounds.length === 0) return "";

  const items = backgrounds.map((bg) => {
    const paramDesc = Object.entries(bg.params)
      .map(([key, schema]) => {
        const defaultVal = JSON.stringify(schema.default);
        return `${key} (${schema.type}, default: ${defaultVal})`;
      })
      .join("; ");
    return `- ${bg.id}: ${bg.description}. Params: {${paramDesc}}`;
  });

  return `REACT BITS ANIMATED BACKGROUNDS:
You may add a React Bits animated background behind the poster content.
If a background suits the design, include this meta tag in <head>:
<meta name="divsigner-background" content='{"id":"<background_id>","params":{<params>}}' />

When using a background, set the HTML body/container background to transparent 
(background: transparent) so the background layer shows through.

Available backgrounds:
${items.join("\n")}

If no background fits, omit the meta tag entirely (generates a poster with its own CSS background).`;
}

function builtinStyleBlock(style: Style): string {
  const t = style.tokens;
  const tokensText = t
    ? `PRESET DESIGN TOKENS:
- Background: ${t.background}
- Foreground: ${t.foreground}
- Accent: ${t.accent}
- Muted: ${t.muted}
- Panel: ${t.panel}
- Border: ${t.border}
- Heading font: ${t.headingFont} (weight ${t.headingWeight})
- Body font: ${t.bodyFont}
- Border radius: ${t.borderRadius}
- Padding: ${t.padding}`
    : "";
  const treatments = (style.backgroundTreatments ?? [])
    .map((x, i) => `${i + 1}. ${x}`)
    .join("\n");
  const bgCatalog = buildBackgroundCatalogDescription();
  return `${style.systemPromptFragment ?? ""}

${tokensText}

${treatments ? `BACKGROUND TREATMENTS (choose one):\n${treatments}\n` : ""}
${bgCatalog ? `${bgCatalog}\n` : ""}
${style.layoutHints ? `LAYOUT HINTS:\n${style.layoutHints}` : ""}`;
}