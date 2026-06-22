import type { AspectRatioKey } from "../utils/constants";

export interface DesignTokens {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  panel: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  borderRadius: string;
  padding: string;
}

export type StyleSource = "builtin" | "custom";

export interface Style {
  id: string;
  name: string;
  description: string;
  /** Source/brand URL for custom styles (shown + linkable in detail). */
  website?: string;
  /** One-line summary derived from design.md (editable). */
  summary?: string;
  source: StyleSource;

  // Built-in structured fields (optional on custom styles).
  tokens?: DesignTokens;
  backgroundTreatments?: string[];
  layoutHints?: string;
  systemPromptFragment?: string;

  // Custom: the freeform design.md injected into the prompt verbatim.
  designMd?: string;
  origin?: { kind: "paste" | "upload" | "url"; ref?: string };

  // Preview: built-ins ship a curated sample; customs render a swatch card.
  sampleHtml?: string;
}

export interface GenerationInput {
  style: Style;
  aspectRatio: AspectRatioKey;
  userPrompt: string;
}