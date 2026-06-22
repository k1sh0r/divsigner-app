/**
 * Background system types for React Bits integration.
 * Backgrounds are React components that render behind the poster HTML.
 */

/** Background parameter value types */
export type ParamValue = string | number | boolean | string[];

/** Parameter schema for UI rendering */
export interface ParamSchema {
  type: "string" | "number" | "boolean" | "color" | "select" | "stringArray";
  default: ParamValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for select type
  description?: string;
}

/**
 * Layer-level parameters applied to EVERY background by the BackgroundLayer
 * wrapper (not passed down to the real component). They render a solid color
 * behind the effect and control layer opacity + blend mode.
 */
export const GLOBAL_BACKGROUND_PARAMS: Record<string, ParamSchema> = {
  backgroundColor: {
    type: "color",
    default: "#0b0b12",
    description: "Solid color rendered behind the effect",
  },
  opacity: {
    type: "number",
    default: 1,
    min: 0,
    max: 1,
    step: 0.05,
    description: "Background layer opacity",
  },
  blendMode: {
    type: "select",
    default: "normal",
    options: [
      "normal",
      "multiply",
      "screen",
      "overlay",
      "darken",
      "lighten",
      "color-dodge",
      "color-burn",
      "hard-light",
      "soft-light",
      "difference",
      "exclusion",
      "hue",
      "saturation",
      "color",
      "luminosity",
    ],
    description: "Blend mode over the poster content",
  },
};

export const GLOBAL_PARAM_KEYS = Object.keys(GLOBAL_BACKGROUND_PARAMS);

/** Global layer params that drive compositing. */
export interface GlobalLayerParams {
  backgroundColor: string;
  opacity: number;
  blendMode: string;
}

/** Default values for the global layer params. */
export const DEFAULT_GLOBAL_PARAMS: GlobalLayerParams = {
  backgroundColor: "#0b0b12",
  opacity: 1,
  blendMode: "normal",
};

/**
 * Split a merged params object into the global layer params and the
 * per-background params that should be forwarded to the real component.
 */
export function splitGlobalParams(
  params: Record<string, unknown>,
): { globalParams: GlobalLayerParams; rest: Record<string, unknown> } {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!GLOBAL_PARAM_KEYS.includes(key)) rest[key] = value;
  }
  return {
    globalParams: {
      backgroundColor:
        (params.backgroundColor as string) ?? DEFAULT_GLOBAL_PARAMS.backgroundColor,
      opacity: (params.opacity as number) ?? DEFAULT_GLOBAL_PARAMS.opacity,
      blendMode: (params.blendMode as string) ?? DEFAULT_GLOBAL_PARAMS.blendMode,
    },
    rest,
  };
}

/** Background definition in the catalog */
export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  /** Category for grouping in UI */
  category: "webgl" | "canvas2d" | "css" | "three";
  /** External dependencies required */
  dependencies: string[];
  /** Parameter schema for UI editing */
  params: Record<string, ParamSchema>;
  /** Default params when LLM doesn't specify */
  defaultParams: Record<string, ParamValue>;
}

/** Background spec embedded in HTML meta tag */
export interface BackgroundSpec {
  id: string;
  params: Record<string, unknown>;
}

/** Props passed to background components */
export interface BackgroundComponentProps {
  width: number;
  height: number;
  params: Record<string, unknown>;
  /** Called when the internal canvas is ready for capture */
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

/** Component entry in catalog */
export interface BackgroundComponentEntry extends BackgroundDef {
  Component: React.ComponentType<BackgroundComponentProps>;
}
