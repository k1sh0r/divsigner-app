import type { Style } from "./types";

export const STYLES: Style[] = [
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    description:
      "Near-black background, brand purple accent, heavy grotesque headlines, monospace data. Premium, typographic, restrained.",
    source: "builtin",
    tokens: {
      background: "#0d0d0f",
      foreground: "#ffffff",
      accent: "#6B57EE",
      muted: "#8a8a93",
      panel: "#161618",
      border: "#26262a",
      headingFont: "Archivo",
      bodyFont: "JetBrains Mono",
      headingWeight: 900,
      borderRadius: "14px",
      padding: "86px",
    },
    backgroundTreatments: [
      "ghosted-type: One huge word in #1a1a1c, Archivo 900, ~430px, bleeding off edge",
      "dot-field: Faint purple dot grid, radial-gradient dots, #6B57EE 16% alpha, 34px spacing",
      "soft-glow: One diffuse purple radial bloom, #6B57EE fading to transparent, blurred ~20px, from edge",
      "word-as-texture: One giant word in #1a1a1c, Archivo 900, ~540px, anchored corner, partially off-frame",
    ],
    layoutHints:
      "Left-aligned or centered. Logo top-left (or top-center for centered). Price bar bottom. Generous padding. One accent moment only.",
    systemPromptFragment: `You are a poster designer in the "Midnight Dark" style.
Design rules: Near-black background (#0d0d0f), single purple accent (#6B57EE) used with restraint.
Headlines: Archivo 900, uppercase, line-height .97, letter-spacing -.02em, white.
Utility/labels: JetBrains Mono, muted gray (#8a8a93).
Eyebrows: mono, uppercase, tracked .22em, purple #6B57EE.
Panels: #161618 fill, #26262a 1px border, 14px radius.
Quiet, typographic, premium. No stock gradients, no glow-for-glow's-sake.
One accent moment only. Everything sized with restraint.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Archivo';src:url('/fonts/archivo-v35-latin-900.woff2') format('woff2');font-weight:900}
@font-face{font-family:'JetBrains Mono';src:url('/fonts/jetbrains-mono-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:#0d0d0f;font-family:'JetBrains Mono',monospace}
.p{padding:86px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center}
.e{color:#6B57EE;text-transform:uppercase;letter-spacing:.22em;font-size:18px;margin-bottom:28px}
h1{font-family:'Archivo';font-weight:900;font-size:128px;line-height:.97;letter-spacing:-.02em;color:#fff;text-transform:uppercase;margin:0}
</style></head><body><div class="p"><div class="e">Quiet · typographic · premium</div><h1>Bold ideas<br>set in dark</h1></div></body></html>`,
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Elegant serif headlines, clean sans body, light canvas. Sophisticated, magazine-quality, timeless.",
    source: "builtin",
    tokens: {
      background: "#FAFAFA",
      foreground: "#1a1a1a",
      accent: "#18181B",
      muted: "#64748B",
      panel: "#F1F5F9",
      border: "#E2E8F0",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      headingWeight: 700,
      borderRadius: "2px",
      padding: "64px",
    },
    backgroundTreatments: [
      "clean: Pure solid background, no texture",
      "subtle-grid: Faint 1px grid lines in border color",
      "gradient-wash: Subtle diagonal gradient from background to slightly warmer tone",
    ],
    layoutHints:
      "Centered or left-aligned. Strong type hierarchy. Generous white space. Minimal decoration. Swiss-style grid.",
    systemPromptFragment: `You are a poster designer in the "Editorial" style.
Design rules: Clean light background (#FAFAFA), dark text (#1a1a1a), monochrome accent.
Headlines: Playfair Display 700, elegant, large, strong visual hierarchy.
Body: Inter 400/700, clean, highly readable.
Minimal decoration. Swiss-style grid. Generous white space.
High contrast between heading and body fonts. Premium, timeless, magazine-quality.
No bright colors. No gradients except subtle wash. No rounded corners (max 2px).`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Playfair Display';src:url('/fonts/playfair-display-v36-latin-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'Inter';src:url('/fonts/inter-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:#FAFAFA;font-family:'Inter',sans-serif}
.p{padding:64px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
h1{font-family:'Playfair Display';font-weight:700;font-size:96px;line-height:1.1;color:#1a1a1a;margin:0 0 24px 0}
.p2{font-size:20px;color:#64748B;max-width:600px;line-height:1.5}
</style></head><body><div class="p"><h1>The Art of<br>Simplicity</h1><div class="p2">A curated collection of timeless design principles for the modern age.</div></div></body></html>`,
  },
  {
    id: "bold-grotesque",
    name: "Bold Grotesque",
    description:
      "Raw, high-impact grotesque headlines, neon accents on dark. Techy, bold, futuristic, statement-making.",
    source: "builtin",
    tokens: {
      background: "#0F0F23",
      foreground: "#E2E8F0",
      accent: "#7C3AED",
      muted: "#94A3B8",
      panel: "#1E1C35",
      border: "#4C1D95",
      headingFont: "Space Grotesk",
      bodyFont: "JetBrains Mono",
      headingWeight: 700,
      borderRadius: "0px",
      padding: "48px",
    },
    backgroundTreatments: [
      "neon-glow: Neon accent glow from edge, blurred, atmospheric",
      "grid-overlay: Thin grid lines in border color across canvas",
      "gradient-mesh: Subtle radial gradient in accent color from corner",
    ],
    layoutHints:
      "Asymmetric, bold, high-impact. Large type. Sharp corners. No rounded elements. Brutalist energy with tech precision.",
    systemPromptFragment: `You are a poster designer in the "Bold Grotesque" style.
Design rules: Deep dark background (#0F0F23), purple neon accent (#7C3AED), light text (#E2E8F0).
Headlines: Space Grotesk 700, bold, large, geometric, no rounded corners.
Body: JetBrains Mono, technical, precise.
Brutalist energy: sharp corners (0px radius), bold typography, visible structure.
Neon accents sparingly. High contrast. Techy, futuristic, statement-making.
No soft shadows. No rounded corners. No decorative borders.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-v17-latin-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'JetBrains Mono';src:url('/fonts/jetbrains-mono-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:#0F0F23;font-family:'JetBrains Mono',monospace}
.p{padding:48px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:flex-end}
h1{font-family:'Space Grotesk';font-weight:700;font-size:140px;line-height:0.9;color:#E2E8F0;text-transform:uppercase;margin:0 0 40px 0;letter-spacing:-0.03em}
.a{color:#7C3AED;font-size:16px;text-transform:uppercase;letter-spacing:0.3em;margin-bottom:24px}
.l{height:4px;background:#7C3AED;width:120px}
</style></head><body><div class="p"><div class="a">SYSTEM OVERRIDE</div><div class="l"></div><h1>FUTURE<br>READY</h1></div></body></html>`,
  },
  // New styles
  {
    id: "neo-brutalism",
    name: "Neo-Brutalism",
    description: "Thick black borders, hard shadows, clashing flat blocks. Bold, raw, uncompromising.",
    source: "builtin",
    tokens: {
      background: "#F5F1E8",
      foreground: "#000000",
      accent: "#FF5A36",
      muted: "#666666",
      panel: "#FFE600",
      border: "#000000",
      headingFont: "Archivo",
      bodyFont: "JetBrains Mono",
      headingWeight: 900,
      borderRadius: "0px",
      padding: "48px",
    },
    backgroundTreatments: [
      "flat-solid: Pure solid background, no texture",
      "offset-shadow: Hard 8px 8px 0 #000 shadow on elements",
      "clashing-blocks: Bright yellow panels against cream background",
    ],
    layoutHints: "Asymmetric, oversized type, visible structure. Elements overlap with hard shadows. No gradients.",
    systemPromptFragment: `You are a poster designer in the "Neo-Brutalism" style.
Design rules: Cream background (#F5F1E8), black borders (#000000) 4px thick, orange accent (#FF5A36).
Headlines: Archivo 900, massive, uppercase, black or white.
Panels: Bright yellow (#FFE600) with thick black borders and hard 8px shadow offset.
No rounded corners (0px). No gradients. No soft shadows.
Brutalist, raw, high contrast. Elements can overlap and clash intentionally.
Every element has a thick black border. Hard shadows only (box-shadow: 8px 8px 0 #000).`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Archivo';src:url('/fonts/archivo-v35-latin-900.woff2') format('woff2');font-weight:900}
html,body{margin:0;width:1080px;height:1080px;background:#F5F1E8;font-family:'Archivo',sans-serif}
.p{padding:48px;box-sizing:border-box;height:1080px;position:relative}
h1{font-weight:900;font-size:120px;line-height:0.95;color:#000;text-transform:uppercase;margin:0;position:relative;z-index:2}
.y{position:absolute;right:48px;top:48px;width:400px;height:300px;background:#FFE600;border:4px solid #000;box-shadow:8px 8px 0 #000}
.o{position:absolute;left:48px;bottom:48px;background:#FF5A36;color:#fff;padding:20px 40px;font-size:24px;font-weight:900;border:4px solid #000;box-shadow:8px 8px 0 #000}
</style></head><body><div class="p"><div class="y"></div><h1>RAW<br>POWER</h1><div class="o">BUY NOW</div></div></body></html>`,
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Translucent layers, backdrop blur, vivid gradients. Modern, airy, floating depth.",
    source: "builtin",
    tokens: {
      background: "#6B57EE",
      foreground: "#ffffff",
      accent: "#ffffff",
      muted: "rgba(255,255,255,0.6)",
      panel: "rgba(255,255,255,0.12)",
      border: "rgba(255,255,255,0.3)",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      headingWeight: 700,
      borderRadius: "24px",
      padding: "64px",
    },
    backgroundTreatments: [
      "vivid-gradient: Purple (#6B57EE) to cyan (#22D3EE) diagonal gradient",
      "glass-card: Translucent white panel with backdrop-filter blur",
      "soft-glow: Subtle white glow behind glass elements",
    ],
    layoutHints: "Centered, floating cards, layered depth. Generous border-radius. Light, airy feel.",
    systemPromptFragment: `You are a poster designer in the "Glassmorphism" style.
Design rules: Vivid gradient background (purple #6B57EE to cyan #22D3EE), white text.
Panels: Translucent white (rgba(255,255,255,0.12)) with backdrop-filter: blur(20px), 1px white border.
Headlines: Space Grotesk 700, white, large.
Body: Inter, white with slight transparency.
Border radius: 24px on all cards. Floating, layered depth effect.
Soft glows, no hard shadows. Modern, airy, premium feel.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-v17-latin-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'Inter';src:url('/fonts/inter-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:linear-gradient(135deg,#6B57EE 0%,#22D3EE 100%);font-family:'Inter',sans-serif}
.p{padding:64px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center}
.c{background:rgba(255,255,255,0.12);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.3);border-radius:24px;padding:60px;max-width:800px;text-align:center}
h1{font-family:'Space Grotesk';font-weight:700;font-size:80px;color:#fff;margin:0 0 20px 0}
p{font-size:20px;color:rgba(255,255,255,0.8);margin:0}
</style></head><body><div class="p"><div class="c"><h1>Ethereal</h1><p>Float through the glass</p></div></div></body></html>`,
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    description: "Soft, puffy 3D shapes with double shadows. Playful, pastel, approachable.",
    source: "builtin",
    tokens: {
      background: "#EEF1FF",
      foreground: "#2B2D42",
      accent: "#7C5CFF",
      muted: "#8D99AE",
      panel: "#FFFFFF",
      border: "rgba(124,92,255,0.2)",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      headingWeight: 700,
      borderRadius: "36px",
      padding: "64px",
    },
    backgroundTreatments: [
      "pastel-bg: Soft blue-white gradient background",
      "puffy-card: White panels with double soft shadows",
      "soft-3d: Inner shadow plus outer shadow for depth",
    ],
    layoutHints: "Rounded everything, soft shadows, pastel palette. Playful, friendly, 3D clay-like feel.",
    systemPromptFragment: `You are a poster designer in the "Claymorphism" style.
Design rules: Pastel background (#EEF1FF), dark text (#2B2D42), purple accent (#7C5CFF).
Panels: White (#FFFFFF) with large border-radius (36px), double soft shadows.
Headlines: Space Grotesk 700, dark.
Body: Inter, muted gray.
Shadows: Soft, multi-layered (0 8px 32px rgba(124,92,255,0.15), inset 0 -4px 12px rgba(0,0,0,0.05)).
Rounded corners on everything. Playful, friendly, 3D clay aesthetic.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-v17-latin-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'Inter';src:url('/fonts/inter-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:#EEF1FF;font-family:'Inter',sans-serif}
.p{padding:64px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center}
.c{background:#fff;border-radius:36px;padding:60px 80px;box-shadow:0 8px 32px rgba(124,92,255,0.15),0 2px 8px rgba(0,0,0,0.05),inset 0 -4px 12px rgba(0,0,0,0.03);text-align:center}
h1{font-family:'Space Grotesk';font-weight:700;font-size:72px;color:#2B2D42;margin:0 0 16px 0}
p{font-size:18px;color:#8D99AE;margin:0}
</style></head><body><div class="p"><div class="c"><h1>Soft Touch</h1><p>Clay-like 3D aesthetics</p></div></div></body></html>`,
  },
  {
    id: "retro-vapor",
    name: "Retro / Vaporwave",
    description: "80s neon grid, chrome text, sunset gradients. Nostalgic, vibrant, surreal.",
    source: "builtin",
    tokens: {
      background: "#2A0944",
      foreground: "#FDEFF9",
      accent: "#00F5D4",
      muted: "#FF6AC1",
      panel: "rgba(0,0,0,0.25)",
      border: "#FF6AC1",
      headingFont: "Space Grotesk",
      bodyFont: "JetBrains Mono",
      headingWeight: 700,
      borderRadius: "4px",
      padding: "64px",
    },
    backgroundTreatments: [
      "sunset-gradient: Purple (#2A0944) to pink (#FF6AC1) gradient",
      "neon-grid: Faint perspective grid lines",
      "chrome-text: Gradient text with metallic shine",
    ],
    layoutHints: "Centered, dramatic, retro-futuristic. Chrome effects, neon glows, grid horizons.",
    systemPromptFragment: `You are a poster designer in the "Retro / Vaporwave" style.
Design rules: Sunset gradient background (deep purple #2A0944 to hot pink #FF6AC1), light text.
Headlines: Space Grotesk 700, chrome/metallic gradient effect.
Body: JetBrains Mono, cyan accent (#00F5D4).
Neon grid perspective lines optional. Chrome text effects.
Panels: Semi-transparent black with pink border.
80s retro-futuristic, vaporwave aesthetic.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Space Grotesk';src:url('/fonts/space-grotesk-v17-latin-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'JetBrains Mono';src:url('/fonts/jetbrains-mono-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:linear-gradient(180deg,#2A0944 0%,#FF6AC1 100%);font-family:'JetBrains Mono',monospace}
.p{padding:64px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
h1{font-family:'Space Grotesk';font-weight:700;font-size:100px;margin:0 0 20px 0;background:linear-gradient(180deg,#fff 0%,#00F5D4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.t{color:#00F5D4;font-size:14px;letter-spacing:0.5em;text-transform:uppercase}
</style></head><body><div class="p"><div class="t">NEON DREAMS</div><h1>VAPOR</h1></div></body></html>`,
  },
  {
    id: "art-deco",
    name: "Art Deco / Geometric",
    description: "Symmetrical geometry, gold accents, elegant serif. Luxurious, timeless, structured.",
    source: "builtin",
    tokens: {
      background: "#0B0B0B",
      foreground: "#F4E2B8",
      accent: "#C9A24B",
      muted: "#8B7355",
      panel: "#111",
      border: "#C9A24B",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      headingWeight: 900,
      borderRadius: "0px",
      padding: "80px",
    },
    backgroundTreatments: [
      "geometric-patterns: Fan motifs, chevrons, sunbursts",
      "gold-rules: Thin gold lines as dividers",
      "symmetrical-frame: Balanced, mirror-image layout",
    ],
    layoutHints: "Perfectly symmetrical, geometric patterns, gold frames. Elegant, luxurious, 1920s glamour.",
    systemPromptFragment: `You are a poster designer in the "Art Deco / Geometric" style.
Design rules: Near-black background (#0B0B0B), cream text (#F4E2B8), gold accent (#C9A24B).
Headlines: Playfair Display 900, elegant, large.
Body: Inter, cream.
Geometric patterns: fans, chevrons, sunbursts. Gold rules and frames.
Symmetrical layout. No rounded corners. Luxurious, 1920s glamour.
Thin gold borders and dividers throughout.`,
    sampleHtml: `<!doctype html><html><head><style>
@font-face{font-family:'Playfair Display';src:url('/fonts/playfair-display-v36-latin-900.woff2') format('woff2');font-weight:900}
@font-face{font-family:'Inter';src:url('/fonts/inter-v18-latin-400.woff2') format('woff2');font-weight:400}
html,body{margin:0;width:1080px;height:1080px;background:#0B0B0B;font-family:'Inter',sans-serif}
.p{padding:80px;box-sizing:border-box;height:1080px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;border:2px solid #C9A24B;margin:40px}
h1{font-family:'Playfair Display';font-weight:900;font-size:90px;color:#F4E2B8;margin:0 0 30px 0;letter-spacing:0.1em}
.l{width:200px;height:2px;background:#C9A24B;margin:0 auto 30px}
.s{color:#C9A24B;font-size:14px;letter-spacing:0.4em;text-transform:uppercase}
</style></head><body><div class="p"><div class="s">EST. 1925</div><div class="l"></div><h1>GRANDEUR</h1></div></body></html>`,
  },
];