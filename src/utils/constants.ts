export const ASPECT_RATIOS = {
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
  "9:16": { width: 1080, height: 1920, label: "Story (9:16)" },
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

export const WHITELISTED_FONTS = [
  "Archivo",
  "JetBrains Mono",
  "Playfair Display",
  "Inter",
  "Space Grotesk",
] as const;

export const FONT_PATHS: Record<string, string[]> = {
  "Archivo": [
    "/fonts/archivo-v35-latin-600.woff2",
    "/fonts/archivo-v35-latin-700.woff2",
    "/fonts/archivo-v35-latin-900.woff2",
  ],
  "JetBrains Mono": [
    "/fonts/jetbrains-mono-v18-latin-400.woff2",
    "/fonts/jetbrains-mono-v18-latin-500.woff2",
    "/fonts/jetbrains-mono-v18-latin-700.woff2",
  ],
  "Playfair Display": [
    "/fonts/playfair-display-v36-latin-400.woff2",
    "/fonts/playfair-display-v36-latin-700.woff2",
    "/fonts/playfair-display-v36-latin-900.woff2",
  ],
  "Inter": [
    "/fonts/inter-v18-latin-400.woff2",
    "/fonts/inter-v18-latin-700.woff2",
  ],
  "Space Grotesk": [
    "/fonts/space-grotesk-v17-latin-400.woff2",
    "/fonts/space-grotesk-v17-latin-700.woff2",
  ],
};

export const EXPORT_PIXEL_RATIO = 2;