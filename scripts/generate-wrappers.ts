/**
 * Generates wrapper components that adapt React Bits background components
 * to the divsigner BackgroundComponentProps interface.
 *
 * Usage: npx tsx scripts/generate-wrappers.ts
 *
 * Each wrapper:
 * 1. Imports the real React Bits component from ../real/<Name>/<Name>
 * 2. Renders it in a sized container div
 * 3. Uses MutationObserver to detect the <canvas> element → calls onCanvasReady
 * 4. Passes params through as component props
 */

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKGROUNDS_DIR = path.join(
  __dirname,
  "..",
  "src",
  "backgrounds",
  "real",
);
const COMPONENTS_DIR = path.join(
  __dirname,
  "..",
  "src",
  "backgrounds",
  "components",
);

interface WrapperConfig {
  id: string;
  /** ID used in the original component file name (may differ from id) */
  componentFile: string;
  /** Name of the real component directory (matches folder name) */
  dirName: string;
  /** The default export name (for components that export a named const) */
  exportName?: string;
}

const wrappers: WrapperConfig[] = [
  { id: "aurora", componentFile: "Aurora", dirName: "Aurora" },
  { id: "balatro", componentFile: "Balatro", dirName: "Balatro" },
  { id: "ballpit", componentFile: "Ballpit", dirName: "Ballpit" },
  { id: "beams", componentFile: "Beams", dirName: "Beams" },
  { id: "colorbends", componentFile: "ColorBends", dirName: "ColorBends" },
  { id: "darkveil", componentFile: "DarkVeil", dirName: "DarkVeil" },
  { id: "dither", componentFile: "Dither", dirName: "Dither" },
  { id: "dotfield", componentFile: "DotField", dirName: "DotField" },
  { id: "dotgrid", componentFile: "DotGrid", dirName: "DotGrid" },
  { id: "evileye", componentFile: "EvilEye", dirName: "EvilEye" },
  { id: "faultyterminal", componentFile: "FaultyTerminal", dirName: "FaultyTerminal" },
  { id: "ferrofluid", componentFile: "Ferrofluid", dirName: "Ferrofluid" },
  { id: "floatinglines", componentFile: "FloatingLines", dirName: "FloatingLines" },
  { id: "galaxy", componentFile: "Galaxy", dirName: "Galaxy" },
  { id: "gradientblinds", componentFile: "GradientBlinds", dirName: "GradientBlinds" },
  { id: "grainient", componentFile: "Grainient", dirName: "Grainient" },
  { id: "griddistortion", componentFile: "GridDistortion", dirName: "GridDistortion" },
  { id: "gridmotion", componentFile: "GridMotion", dirName: "GridMotion" },
  { id: "gridscan", componentFile: "GridScan", dirName: "GridScan", exportName: "GridScan" },
  { id: "hyperspeed", componentFile: "Hyperspeed", dirName: "Hyperspeed" },
  { id: "iridescence", componentFile: "Iridescence", dirName: "Iridescence" },
  { id: "letterglitch", componentFile: "LetterGlitch", dirName: "LetterGlitch" },
  { id: "lightfall", componentFile: "Lightfall", dirName: "Lightfall" },
  { id: "lightning", componentFile: "Lightning", dirName: "Lightning" },
  { id: "lightpillar", componentFile: "LightPillar", dirName: "LightPillar" },
  { id: "lightrays", componentFile: "LightRays", dirName: "LightRays" },
  { id: "linewaves", componentFile: "LineWaves", dirName: "LineWaves" },
  { id: "liquidchrome", componentFile: "LiquidChrome", dirName: "LiquidChrome", exportName: "LiquidChrome" },
  { id: "liquidether", componentFile: "LiquidEther", dirName: "LiquidEther" },
  { id: "orb", componentFile: "Orb", dirName: "Orb" },
  { id: "particles", componentFile: "Particles", dirName: "Particles" },
  { id: "pixelblast", componentFile: "PixelBlast", dirName: "PixelBlast" },
  { id: "pixelsnow", componentFile: "PixelSnow", dirName: "PixelSnow" },
  { id: "plasma", componentFile: "Plasma", dirName: "Plasma" },
  { id: "plasmawave", componentFile: "PlasmaWave", dirName: "PlasmaWave" },
  { id: "prism", componentFile: "Prism", dirName: "Prism" },
  { id: "prismaticburst", componentFile: "PrismaticBurst", dirName: "PrismaticBurst" },
  { id: "radar", componentFile: "Radar", dirName: "Radar" },
  { id: "ripplegrid", componentFile: "RippleGrid", dirName: "RippleGrid" },
  { id: "shapegrid", componentFile: "ShapeGrid", dirName: "ShapeGrid" },
  { id: "siderays", componentFile: "SideRays", dirName: "SideRays" },
  { id: "silk", componentFile: "Silk", dirName: "Silk" },
  { id: "softaurora", componentFile: "SoftAurora", dirName: "SoftAurora" },
  { id: "threads", componentFile: "Threads", dirName: "Threads" },
  { id: "waves", componentFile: "Waves", dirName: "Waves" },
];

function generateWrapper(config: WrapperConfig): string {
  const { id, componentFile, dirName, exportName } = config;

  // Check if the component uses 'use client' directive
  const tsxPath = path.join(BACKGROUNDS_DIR, dirName, `${componentFile}.tsx`);
  const content = fs.readFileSync(tsxPath, "utf-8");
  const hasUseClient = content.startsWith("'use client'");

  const useClientDirective = hasUseClient ? "'use client';\n\n" : "";

  // Some components export named (e.g. GridScan, LiquidChrome) — use direct default import
  const importName = componentFile;

  return `${useClientDirective}import { useEffect, useRef } from "react";
import type { BackgroundComponentProps } from "../types";
${exportName === "GridScan" ? `import { ${componentFile} as Real${componentFile} } from "../real/${dirName}/${componentFile}";` : `import Real${componentFile} from "../real/${dirName}/${componentFile}";`}

/**
 * Wrapper that adapts the React Bits ${componentFile} background
 * to the divsigner BackgroundComponentProps interface.
 * Source: https://github.com/DavidHDev/react-bits
 */
export default function ${componentFile}({
  width,
  height,
  params,
  onCanvasReady,
}: BackgroundComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use MutationObserver to detect when a <canvas> element is mounted
    let canvasFound = false;
    const observer = new MutationObserver(() => {
      if (canvasFound) return;
      const canvas = container!.querySelector("canvas");
      if (canvas) {
        canvasFound = true;
        onCanvasReady?.(canvas);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    // Also check immediately in case canvas is already mounted
    const existing = container.querySelector("canvas");
    if (existing) {
      canvasFound = true;
      onCanvasReady?.(existing);
      observer.disconnect();
    }

    return () => {
      observer.disconnect();
    };
  }, [onCanvasReady]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: \`\${width}px\`,
        height: \`\${height}px\`,
        overflow: "hidden",
      }}
    >
      <Real${componentFile} {...(params as Record<string, unknown>)} />
    </div>
  );
}
`;
}

// Generate all wrapper files
let generated = 0;
let errors: string[] = [];

for (const config of wrappers) {
  try {
    const wrapper = generateWrapper(config);
    const outPath = path.join(COMPONENTS_DIR, `${config.componentFile}.tsx`);
    fs.writeFileSync(outPath, wrapper, "utf-8");
    generated++;
    console.log(`✅ ${config.componentFile}.tsx`);
  } catch (err) {
    const msg = `❌ ${config.componentFile}: ${err}`;
    errors.push(msg);
    console.error(msg);
  }
}

console.log(`\nGenerated ${generated}/${wrappers.length} wrapper components`);
if (errors.length) {
  console.log(`\nErrors:\n${errors.join("\n")}`);
  process.exit(1);
}
