import { lazy } from "react";
import type { BackgroundDef, BackgroundComponentEntry } from "./types";
import { GLOBAL_BACKGROUND_PARAMS } from "./types";

const AuroraComponent = lazy(() => import("./components/Aurora"));
const DotFieldComponent = lazy(() => import("./components/DotField"));
const WavesComponent = lazy(() => import("./components/Waves"));
const FloatingLinesComponent = lazy(() => import("./components/FloatingLines"));
const GridMotionComponent = lazy(() => import("./components/GridMotion"));
const GridScanComponent = lazy(() => import("./components/GridScan"));
const RadarComponent = lazy(() => import("./components/Radar"));
const PixelSnowComponent = lazy(() => import("./components/PixelSnow"));
const RippleGridComponent = lazy(() => import("./components/RippleGrid"));
const LightningComponent = lazy(() => import("./components/Lightning"));
const ShapeGridComponent = lazy(() => import("./components/ShapeGrid"));
const DitherComponent = lazy(() => import("./components/Dither"));
const LetterGlitchComponent = lazy(() => import("./components/LetterGlitch"));
const SilkComponent = lazy(() => import("./components/Silk"));
const ParticlesComponent = lazy(() => import("./components/Particles"));
const BeamsComponent = lazy(() => import("./components/Beams"));
const SoftAuroraComponent = lazy(() => import("./components/SoftAurora"));
const PlasmaWaveComponent = lazy(() => import("./components/PlasmaWave"));
const ColorBendsComponent = lazy(() => import("./components/ColorBends"));
const ThreadsComponent = lazy(() => import("./components/Threads"));
const LightRaysComponent = lazy(() => import("./components/LightRays"));
const GrainientComponent = lazy(() => import("./components/Grainient"));
const PixelBlastComponent = lazy(() => import("./components/PixelBlast"));
const GradientBlindsComponent = lazy(() => import("./components/GradientBlinds"));
const HyperspeedComponent = lazy(() => import("./components/Hyperspeed"));
const GalaxyComponent = lazy(() => import("./components/Galaxy"));
const DotGridComponent = lazy(() => import("./components/DotGrid"));
const FaultyTerminalComponent = lazy(() => import("./components/FaultyTerminal"));
const IridescenceComponent = lazy(() => import("./components/Iridescence"));
const LightPillarComponent = lazy(() => import("./components/LightPillar"));
const LightfallComponent = lazy(() => import("./components/Lightfall"));
const SideRaysComponent = lazy(() => import("./components/SideRays"));
const LineWavesComponent = lazy(() => import("./components/LineWaves"));
const OrbComponent = lazy(() => import("./components/Orb"));
const PrismComponent = lazy(() => import("./components/Prism"));
const PrismaticBurstComponent = lazy(() => import("./components/PrismaticBurst"));
const LiquidEtherComponent = lazy(() => import("./components/LiquidEther"));
const PlasmaComponent = lazy(() => import("./components/Plasma"));
const BalatroComponent = lazy(() => import("./components/Balatro"));
const LiquidChromeComponent = lazy(() => import("./components/LiquidChrome"));
const EvilEyeComponent = lazy(() => import("./components/EvilEye"));
const BallpitComponent = lazy(() => import("./components/Ballpit"));
const FerrofluidComponent = lazy(() => import("./components/Ferrofluid"));
const DarkVeilComponent = lazy(() => import("./components/DarkVeil"));
const GridDistortionComponent = lazy(() => import("./components/GridDistortion"));

export const BACKGROUND_CATALOG: BackgroundDef[] = [];

const componentMap = new Map<string, BackgroundComponentEntry>();

// NOTE: Each entry's params mirror the corresponding React Bits component's
// documented props (names + defaults sourced from the upstream component in
// ../real/*, a faithful copy of reactbits.dev). Reserved layer params
// (backgroundColor / opacity / blendMode) are handled globally and never
// duplicated here; tuple/object/function/ReactNode props and non-visual props
// (className, style, dpr, paused, mixBlendMode) are omitted because the param
// editor can't represent them. Slider ranges are chosen around each default.

// Aurora
registerBackground({
  id: "aurora",
  name: "Aurora",
  description: "Northern lights flowing effect with customizable color stops",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    colorStops: { type: "stringArray", default: ["#5227FF", "#7cff67", "#5227FF"], description: "Gradient color stops" },
    amplitude: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Wave amplitude" },
    blend: { type: "number", default: 0.5, min: 0, max: 1, step: 0.05, description: "Blend smoothness" },
    speed: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Animation speed" },
  },
  defaultParams: { colorStops: ["#5227FF", "#7cff67", "#5227FF"], amplitude: 1.0, blend: 0.5, speed: 1.0 },
  Component: AuroraComponent,
});

// Dot Field
registerBackground({
  id: "dotfield",
  name: "Dot Field",
  description: "Animated dot grid with wave motion and gradient colors",
  category: "canvas2d",
  dependencies: [],
  params: {
    dotRadius: { type: "number", default: 1.5, min: 0.5, max: 6, step: 0.1, description: "Dot radius" },
    dotSpacing: { type: "number", default: 14, min: 4, max: 40, step: 1, description: "Spacing between dots" },
    cursorRadius: { type: "number", default: 500, min: 50, max: 1000, step: 10, description: "Cursor influence radius" },
    cursorForce: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Cursor force" },
    bulgeOnly: { type: "boolean", default: true, description: "Bulge dots only" },
    bulgeStrength: { type: "number", default: 67, min: 0, max: 200, step: 1, description: "Bulge strength" },
    glowRadius: { type: "number", default: 160, min: 0, max: 400, step: 5, description: "Glow radius" },
    sparkle: { type: "boolean", default: false, description: "Sparkle effect" },
    waveAmplitude: { type: "number", default: 0, min: 0, max: 10, step: 0.5, description: "Wave amplitude" },
    gradientFrom: { type: "color", default: "rgba(168, 85, 247, 0.35)", description: "Gradient start color" },
    gradientTo: { type: "color", default: "rgba(180, 151, 207, 0.25)", description: "Gradient end color" },
    glowColor: { type: "color", default: "#120F17", description: "Glow color" },
  },
  defaultParams: { dotRadius: 1.5, dotSpacing: 14, cursorRadius: 500, cursorForce: 0.1, bulgeOnly: true, bulgeStrength: 67, glowRadius: 160, sparkle: false, waveAmplitude: 0, gradientFrom: "rgba(168, 85, 247, 0.35)", gradientTo: "rgba(180, 151, 207, 0.25)", glowColor: "#120F17" },
  Component: DotFieldComponent,
});

// Waves
registerBackground({
  id: "waves",
  name: "Waves",
  description: "Flowing wave lines with noise-based motion",
  category: "canvas2d",
  dependencies: [],
  params: {
    lineColor: { type: "color", default: "black", description: "Wave line color" },
    waveSpeedX: { type: "number", default: 0.0125, min: 0, max: 0.1, step: 0.001, description: "Horizontal wave speed" },
    waveSpeedY: { type: "number", default: 0.005, min: 0, max: 0.1, step: 0.001, description: "Vertical wave speed" },
    waveAmpX: { type: "number", default: 32, min: 0, max: 100, step: 1, description: "Horizontal wave amplitude" },
    waveAmpY: { type: "number", default: 16, min: 0, max: 100, step: 1, description: "Vertical wave amplitude" },
    xGap: { type: "number", default: 10, min: 1, max: 50, step: 1, description: "Horizontal line spacing" },
    yGap: { type: "number", default: 32, min: 5, max: 100, step: 1, description: "Vertical point spacing" },
    friction: { type: "number", default: 0.925, min: 0.8, max: 1, step: 0.005, description: "Cursor friction" },
    tension: { type: "number", default: 0.005, min: 0, max: 0.05, step: 0.001, description: "Cursor tension" },
    maxCursorMove: { type: "number", default: 100, min: 0, max: 300, step: 10, description: "Max cursor move" },
  },
  defaultParams: { lineColor: "black", waveSpeedX: 0.0125, waveSpeedY: 0.005, waveAmpX: 32, waveAmpY: 16, xGap: 10, yGap: 32, friction: 0.925, tension: 0.005, maxCursorMove: 100 },
  Component: WavesComponent,
});

// Floating Lines
registerBackground({
  id: "floatinglines",
  name: "Floating Lines",
  description: "Smooth animated sinusoidal lines with varying phases",
  category: "canvas2d",
  dependencies: [],
  params: {
    linesGradient: { type: "stringArray", default: ["#5227FF", "#FF9FFC", "#B497CF"], description: "Line gradient colors" },
    animationSpeed: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Animation speed" },
    interactive: { type: "boolean", default: true, description: "Mouse interactive" },
    bendRadius: { type: "number", default: 5.0, min: 0, max: 20, step: 0.5, description: "Bend radius" },
    bendStrength: { type: "number", default: -0.5, min: -2, max: 2, step: 0.1, description: "Bend strength" },
    mouseDamping: { type: "number", default: 0.05, min: 0, max: 1, step: 0.01, description: "Mouse damping" },
    parallax: { type: "boolean", default: true, description: "Parallax effect" },
    parallaxStrength: { type: "number", default: 0.2, min: 0, max: 1, step: 0.05, description: "Parallax strength" },
  },
  defaultParams: { linesGradient: ["#5227FF", "#FF9FFC", "#B497CF"], animationSpeed: 1, interactive: true, bendRadius: 5.0, bendStrength: -0.5, mouseDamping: 0.05, parallax: true, parallaxStrength: 0.2 },
  Component: FloatingLinesComponent,
});

// Grid Motion
registerBackground({
  id: "gridmotion",
  name: "Grid Motion",
  description: "Scrolling grid of tiles with rotation",
  category: "canvas2d",
  dependencies: [],
  params: {
    gradientColor: { type: "color", default: "black", description: "Radial gradient color" },
  },
  defaultParams: { gradientColor: "black" },
  Component: GridMotionComponent,
});

// Grid Scan
registerBackground({
  id: "gridscan",
  name: "Grid Scan",
  description: "Scanning line sweeping across a grid pattern",
  category: "webgl",
  dependencies: ["three"],
  params: {
    sensitivity: { type: "number", default: 0.55, min: 0, max: 1, step: 0.01, description: "Scan sensitivity" },
    lineThickness: { type: "number", default: 1, min: 0.25, max: 5, step: 0.25, description: "Grid line thickness" },
    linesColor: { type: "color", default: "#2F293A", description: "Grid line color" },
    scanColor: { type: "color", default: "#FF9FFC", description: "Scan line color" },
    scanOpacity: { type: "number", default: 0.4, min: 0, max: 1, step: 0.05, description: "Scan opacity" },
    gridScale: { type: "number", default: 0.1, min: 0.02, max: 0.5, step: 0.01, description: "Grid scale" },
    lineStyle: { type: "select", default: "solid", options: ["solid", "dashed", "dotted"], description: "Grid line style" },
    lineJitter: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Line jitter" },
    scanDirection: { type: "select", default: "pingpong", options: ["forward", "backward", "pingpong"], description: "Scan direction" },
    chromaticAberration: { type: "number", default: 0.002, min: 0, max: 0.02, step: 0.001, description: "Chromatic aberration" },
    noiseIntensity: { type: "number", default: 0.01, min: 0, max: 0.5, step: 0.01, description: "Noise intensity" },
    scanGlow: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Scan glow" },
    scanSoftness: { type: "number", default: 2, min: 0, max: 8, step: 0.5, description: "Scan softness" },
    scanDuration: { type: "number", default: 2.0, min: 0.5, max: 6, step: 0.5, description: "Scan duration (s)" },
    scanDelay: { type: "number", default: 2.0, min: 0, max: 6, step: 0.5, description: "Delay between scans (s)" },
  },
  defaultParams: { sensitivity: 0.55, lineThickness: 1, linesColor: "#2F293A", scanColor: "#FF9FFC", scanOpacity: 0.4, gridScale: 0.1, lineStyle: "solid", lineJitter: 0.1, scanDirection: "pingpong", chromaticAberration: 0.002, noiseIntensity: 0.01, scanGlow: 0.5, scanSoftness: 2, scanDuration: 2.0, scanDelay: 2.0 },
  Component: GridScanComponent,
});

// Radar
registerBackground({
  id: "radar",
  name: "Radar",
  description: "Radar sweep with concentric rings and spokes",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Sweep speed" },
    scale: { type: "number", default: 0.5, min: 0.1, max: 2, step: 0.05, description: "Scale" },
    ringCount: { type: "number", default: 10, min: 1, max: 30, step: 1, description: "Concentric rings" },
    spokeCount: { type: "number", default: 10, min: 1, max: 30, step: 1, description: "Spokes" },
    ringThickness: { type: "number", default: 0.05, min: 0.005, max: 0.3, step: 0.005, description: "Ring thickness" },
    spokeThickness: { type: "number", default: 0.01, min: 0.001, max: 0.2, step: 0.001, description: "Spoke thickness" },
    sweepSpeed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Sweep speed" },
    sweepWidth: { type: "number", default: 2.0, min: 0.1, max: 6, step: 0.1, description: "Sweep width" },
    sweepLobes: { type: "number", default: 1.0, min: 1, max: 6, step: 1, description: "Sweep lobes" },
    color: { type: "color", default: "#9f29ff", description: "Ring/sweep color" },
    falloff: { type: "number", default: 2.0, min: 0.1, max: 6, step: 0.1, description: "Edge falloff" },
    brightness: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Brightness" },
    enableMouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseInfluence: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Mouse influence" },
  },
  defaultParams: { speed: 1.0, scale: 0.5, ringCount: 10, spokeCount: 10, ringThickness: 0.05, spokeThickness: 0.01, sweepSpeed: 1.0, sweepWidth: 2.0, sweepLobes: 1.0, color: "#9f29ff", falloff: 2.0, brightness: 1.0, enableMouseInteraction: true, mouseInfluence: 0.1 },
  Component: RadarComponent,
});

// Pixel Snow
registerBackground({
  id: "pixelsnow",
  name: "Pixel Snow",
  description: "Falling pixel particles like snow",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    flakeSize: { type: "number", default: 0.01, min: 0.002, max: 0.05, step: 0.002, description: "Flake size" },
    minFlakeSize: { type: "number", default: 1.25, min: 0.5, max: 5, step: 0.25, description: "Minimum flake size" },
    pixelResolution: { type: "number", default: 200, min: 50, max: 600, step: 10, description: "Pixel resolution" },
    speed: { type: "number", default: 1.25, min: 0, max: 5, step: 0.05, description: "Fall speed" },
    depthFade: { type: "number", default: 8, min: 0, max: 20, step: 0.5, description: "Depth fade" },
    farPlane: { type: "number", default: 20, min: 5, max: 50, step: 1, description: "Far plane" },
    brightness: { type: "number", default: 1, min: 0, max: 3, step: 0.05, description: "Brightness" },
    gamma: { type: "number", default: 0.4545, min: 0.1, max: 2.2, step: 0.05, description: "Gamma" },
    density: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Density" },
    variant: { type: "select", default: "square", options: ["square", "round", "snowflake"], description: "Flake shape" },
    direction: { type: "number", default: 125, min: 0, max: 360, step: 1, description: "Fall direction (deg)" },
  },
  defaultParams: { flakeSize: 0.01, minFlakeSize: 1.25, pixelResolution: 200, speed: 1.25, depthFade: 8, farPlane: 20, brightness: 1, gamma: 0.4545, density: 0.3, variant: "square", direction: 125 },
  Component: PixelSnowComponent,
});

// Ripple Grid
registerBackground({
  id: "ripplegrid",
  name: "Ripple Grid",
  description: "Perspective grid with ripple distortion",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    enableRainbow: { type: "boolean", default: false, description: "Rainbow colors" },
    gridColor: { type: "color", default: "#ffffff", description: "Grid color" },
    rippleIntensity: { type: "number", default: 0.05, min: 0, max: 0.5, step: 0.01, description: "Ripple intensity" },
    gridSize: { type: "number", default: 10.0, min: 1, max: 30, step: 0.5, description: "Grid size" },
    gridThickness: { type: "number", default: 15.0, min: 1, max: 40, step: 1, description: "Grid thickness" },
    fadeDistance: { type: "number", default: 1.5, min: 0.1, max: 5, step: 0.1, description: "Fade distance" },
    vignetteStrength: { type: "number", default: 2.0, min: 0, max: 5, step: 0.1, description: "Vignette strength" },
    glowIntensity: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Glow intensity" },
    gridRotation: { type: "number", default: 0, min: -180, max: 180, step: 1, description: "Grid rotation (deg)" },
    mouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseInteractionRadius: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Mouse radius" },
  },
  defaultParams: { enableRainbow: false, gridColor: "#ffffff", rippleIntensity: 0.05, gridSize: 10.0, gridThickness: 15.0, fadeDistance: 1.5, vignetteStrength: 2.0, glowIntensity: 0.1, gridRotation: 0, mouseInteraction: true, mouseInteractionRadius: 1 },
  Component: RippleGridComponent,
});

// Lightning
registerBackground({
  id: "lightning",
  name: "Lightning",
  description: "Animated lightning bolts with screen flashes",
  category: "webgl",
  dependencies: [],
  params: {
    hue: { type: "number", default: 230, min: 0, max: 360, step: 1, description: "Bolt hue" },
    xOffset: { type: "number", default: 0, min: -2, max: 2, step: 0.1, description: "Horizontal offset" },
    speed: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Animation speed" },
    intensity: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Bolt intensity" },
    size: { type: "number", default: 1, min: 0.1, max: 3, step: 0.1, description: "Bolt size" },
  },
  defaultParams: { hue: 230, xOffset: 0, speed: 1, intensity: 1, size: 1 },
  Component: LightningComponent,
});

// Shape Grid
registerBackground({
  id: "shapegrid",
  name: "Shape Grid",
  description: "Grid of shapes with hover trail fill",
  category: "canvas2d",
  dependencies: [],
  params: {
    direction: { type: "select", default: "right", options: ["diagonal", "up", "right", "down", "left"], description: "Scroll direction" },
    speed: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Animation speed" },
    borderColor: { type: "color", default: "#999", description: "Shape border color" },
    squareSize: { type: "number", default: 40, min: 10, max: 120, step: 5, description: "Shape size" },
    hoverFillColor: { type: "color", default: "#222", description: "Hover fill color" },
    shape: { type: "select", default: "square", options: ["square", "hexagon", "circle", "triangle"], description: "Shape type" },
    hoverTrailAmount: { type: "number", default: 0, min: 0, max: 20, step: 1, description: "Hover trail length" },
  },
  defaultParams: { direction: "right", speed: 1, borderColor: "#999", squareSize: 40, hoverFillColor: "#222", shape: "square", hoverTrailAmount: 0 },
  Component: ShapeGridComponent,
});

// Dither
registerBackground({
  id: "dither",
  name: "Dither",
  description: "Animated dithered waves with retro color banding",
  category: "three",
  dependencies: ["three", "@react-three/fiber", "@react-three/postprocessing"],
  params: {
    waveSpeed: { type: "number", default: 0.05, min: 0, max: 0.5, step: 0.01, description: "Wave speed" },
    waveFrequency: { type: "number", default: 3, min: 0.5, max: 10, step: 0.5, description: "Wave frequency" },
    waveAmplitude: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Wave amplitude" },
    waveColor: { type: "color", default: "#808080", description: "Wave color" },
    colorNum: { type: "number", default: 4, min: 2, max: 16, step: 1, description: "Color levels" },
    pixelSize: { type: "number", default: 2, min: 1, max: 10, step: 1, description: "Pixel size" },
    disableAnimation: { type: "boolean", default: false, description: "Disable animation" },
    enableMouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseRadius: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Mouse radius" },
  },
  defaultParams: { waveSpeed: 0.05, waveFrequency: 3, waveAmplitude: 0.3, waveColor: "#808080", colorNum: 4, pixelSize: 2, disableAnimation: false, enableMouseInteraction: true, mouseRadius: 1 },
  Component: DitherComponent,
});

// Letter Glitch
registerBackground({
  id: "letterglitch",
  name: "Letter Glitch",
  description: "Matrix-style character rain with glitch effect",
  category: "canvas2d",
  dependencies: [],
  params: {
    glitchColors: { type: "stringArray", default: ["#2b4539", "#61dca3", "#61b3dc"], description: "Glitch colors" },
    glitchSpeed: { type: "number", default: 50, min: 5, max: 200, step: 5, description: "Glitch speed (ms)" },
    centerVignette: { type: "boolean", default: false, description: "Center vignette" },
    outerVignette: { type: "boolean", default: true, description: "Outer vignette" },
    smooth: { type: "boolean", default: true, description: "Smooth transitions" },
    characters: { type: "string", default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789", description: "Character set" },
  },
  defaultParams: { glitchColors: ["#2b4539", "#61dca3", "#61b3dc"], glitchSpeed: 50, centerVignette: false, outerVignette: true, smooth: true, characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789" },
  Component: LetterGlitchComponent,
});

// Silk
registerBackground({
  id: "silk",
  name: "Silk",
  description: "Flowing silk shader with fractal wave distortion",
  category: "three",
  dependencies: ["three", "@react-three/fiber"],
  params: {
    speed: { type: "number", default: 5, min: 0, max: 20, step: 0.5, description: "Animation speed" },
    scale: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Pattern scale" },
    color: { type: "color", default: "#7B7481", description: "Silk color" },
    noiseIntensity: { type: "number", default: 1.5, min: 0, max: 5, step: 0.1, description: "Noise intensity" },
    rotation: { type: "number", default: 0, min: -3.14, max: 3.14, step: 0.05, description: "Rotation (rad)" },
  },
  defaultParams: { speed: 5, scale: 1, color: "#7B7481", noiseIntensity: 1.5, rotation: 0 },
  Component: SilkComponent,
});

// Particles
registerBackground({
  id: "particles",
  name: "Particles",
  description: "Floating particle field with glow",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    particleColors: { type: "stringArray", default: ["#ffffff", "#ffffff", "#ffffff"], description: "Particle colors" },
    particleCount: { type: "number", default: 200, min: 10, max: 1000, step: 10, description: "Particle count" },
    particleSpread: { type: "number", default: 10, min: 1, max: 30, step: 1, description: "Particle spread" },
    speed: { type: "number", default: 0.1, min: 0, max: 2, step: 0.05, description: "Movement speed" },
    moveParticlesOnHover: { type: "boolean", default: false, description: "Move on hover" },
    particleHoverFactor: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Hover factor" },
    alphaParticles: { type: "boolean", default: false, description: "Alpha particles" },
    particleBaseSize: { type: "number", default: 100, min: 10, max: 400, step: 10, description: "Base particle size" },
    sizeRandomness: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Size randomness" },
    cameraDistance: { type: "number", default: 20, min: 5, max: 50, step: 1, description: "Camera distance" },
    disableRotation: { type: "boolean", default: false, description: "Disable rotation" },
  },
  defaultParams: { particleColors: ["#ffffff", "#ffffff", "#ffffff"], particleCount: 200, particleSpread: 10, speed: 0.1, moveParticlesOnHover: false, particleHoverFactor: 1, alphaParticles: false, particleBaseSize: 100, sizeRandomness: 1, cameraDistance: 20, disableRotation: false },
  Component: ParticlesComponent,
});

// Beams
registerBackground({
  id: "beams",
  name: "Beams",
  description: "Swaying light beams with bloom effect",
  category: "three",
  dependencies: ["three", "@react-three/fiber", "@react-three/drei", "postprocessing"],
  params: {
    beamWidth: { type: "number", default: 2, min: 0.5, max: 10, step: 0.5, description: "Beam width" },
    beamHeight: { type: "number", default: 15, min: 5, max: 40, step: 1, description: "Beam height" },
    beamNumber: { type: "number", default: 12, min: 1, max: 40, step: 1, description: "Beam count" },
    lightColor: { type: "color", default: "#ffffff", description: "Beam light color" },
    speed: { type: "number", default: 2, min: 0, max: 10, step: 0.5, description: "Sway speed" },
    noiseIntensity: { type: "number", default: 1.75, min: 0, max: 5, step: 0.05, description: "Noise intensity" },
    scale: { type: "number", default: 0.2, min: 0.05, max: 2, step: 0.05, description: "Noise scale" },
    rotation: { type: "number", default: 0, min: -180, max: 180, step: 1, description: "Rotation (deg)" },
  },
  defaultParams: { beamWidth: 2, beamHeight: 15, beamNumber: 12, lightColor: "#ffffff", speed: 2, noiseIntensity: 1.75, scale: 0.2, rotation: 0 },
  Component: BeamsComponent,
});

// Soft Aurora
registerBackground({
  id: "softaurora",
  name: "Soft Aurora",
  description: "Ethereal flowing aurora with two-tone gradient",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 0.6, min: 0, max: 3, step: 0.1, description: "Flow speed" },
    scale: { type: "number", default: 1.5, min: 0.1, max: 5, step: 0.1, description: "Scale" },
    brightness: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Brightness" },
    color1: { type: "color", default: "#f7f7f7", description: "First gradient color" },
    color2: { type: "color", default: "#e100ff", description: "Second gradient color" },
    noiseFrequency: { type: "number", default: 2.5, min: 0.5, max: 8, step: 0.1, description: "Noise frequency" },
    noiseAmplitude: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Noise amplitude" },
    bandHeight: { type: "number", default: 0.5, min: 0.1, max: 2, step: 0.05, description: "Band height" },
    bandSpread: { type: "number", default: 1.0, min: 0.1, max: 3, step: 0.1, description: "Band spread" },
    octaveDecay: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Octave decay" },
    layerOffset: { type: "number", default: 0, min: -2, max: 2, step: 0.1, description: "Layer offset" },
    colorSpeed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Color cycle speed" },
    enableMouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseInfluence: { type: "number", default: 0.25, min: 0, max: 1, step: 0.05, description: "Mouse influence" },
  },
  defaultParams: { speed: 0.6, scale: 1.5, brightness: 1.0, color1: "#f7f7f7", color2: "#e100ff", noiseFrequency: 2.5, noiseAmplitude: 1.0, bandHeight: 0.5, bandSpread: 1.0, octaveDecay: 0.1, layerOffset: 0, colorSpeed: 1.0, enableMouseInteraction: true, mouseInfluence: 0.25 },
  Component: SoftAuroraComponent,
});

// Plasma Wave
registerBackground({
  id: "plasmawave",
  name: "Plasma Wave",
  description: "Two-tone plasma waves with sine interference",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    colors: { type: "stringArray", default: ["#A855F7", "#06B6D4"], description: "Wave colors (2)" },
    xOffset: { type: "number", default: 0, min: -2, max: 2, step: 0.05, description: "Horizontal offset" },
    yOffset: { type: "number", default: 0, min: -2, max: 2, step: 0.05, description: "Vertical offset" },
    rotationDeg: { type: "number", default: 0, min: -180, max: 180, step: 1, description: "Rotation (deg)" },
    focalLength: { type: "number", default: 0.8, min: 0.1, max: 3, step: 0.1, description: "Focal length" },
    speed1: { type: "number", default: 0.05, min: 0, max: 0.5, step: 0.01, description: "Wave 1 speed" },
    speed2: { type: "number", default: 0.05, min: 0, max: 0.5, step: 0.01, description: "Wave 2 speed" },
    bend1: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Wave 1 bend" },
    bend2: { type: "number", default: 0.5, min: 0, max: 5, step: 0.1, description: "Wave 2 bend" },
  },
  defaultParams: { colors: ["#A855F7", "#06B6D4"], xOffset: 0, yOffset: 0, rotationDeg: 0, focalLength: 0.8, speed1: 0.05, speed2: 0.05, bend1: 1, bend2: 0.5 },
  Component: PlasmaWaveComponent,
});

// Color Bends
registerBackground({
  id: "colorbends",
  name: "Color Bends",
  description: "Flowing color bands with wave distortion",
  category: "three",
  dependencies: ["three"],
  params: {
    colors: { type: "stringArray", default: ["#5227FF", "#FF9FFC", "#B497CF"], description: "Band colors" },
    rotation: { type: "number", default: 90, min: -180, max: 180, step: 1, description: "Rotation (deg)" },
    speed: { type: "number", default: 0.2, min: 0, max: 2, step: 0.05, description: "Animation speed" },
    transparent: { type: "boolean", default: true, description: "Transparent background" },
    autoRotate: { type: "number", default: 0, min: -2, max: 2, step: 0.1, description: "Auto rotate speed" },
    scale: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Scale" },
    frequency: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Frequency" },
    warpStrength: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Warp strength" },
    mouseInfluence: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Mouse influence" },
    parallax: { type: "number", default: 0.5, min: 0, max: 2, step: 0.1, description: "Parallax" },
    noise: { type: "number", default: 0.15, min: 0, max: 1, step: 0.01, description: "Noise" },
    iterations: { type: "number", default: 1, min: 1, max: 6, step: 1, description: "Iterations" },
    intensity: { type: "number", default: 1.5, min: 0, max: 4, step: 0.1, description: "Intensity" },
    bandWidth: { type: "number", default: 6, min: 1, max: 20, step: 1, description: "Band width" },
  },
  defaultParams: { colors: ["#5227FF", "#FF9FFC", "#B497CF"], rotation: 90, speed: 0.2, transparent: true, autoRotate: 0, scale: 1, frequency: 1, warpStrength: 1, mouseInfluence: 1, parallax: 0.5, noise: 0.15, iterations: 1, intensity: 1.5, bandWidth: 6 },
  Component: ColorBendsComponent,
});

// Threads
registerBackground({
  id: "threads",
  name: "Threads",
  description: "Interweaving thread-like lines with sinusoidal motion",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    amplitude: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Wave amplitude" },
    distance: { type: "number", default: 0, min: 0, max: 3, step: 0.1, description: "Line distance" },
    enableMouseInteraction: { type: "boolean", default: false, description: "Mouse interactive" },
  },
  defaultParams: { amplitude: 1, distance: 0, enableMouseInteraction: false },
  Component: ThreadsComponent,
});

// Light Rays
registerBackground({
  id: "lightrays",
  name: "Light Rays",
  description: "Volumetric light rays emanating from an origin",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    raysOrigin: { type: "select", default: "top-center", options: ["top-center", "top-left", "top-right", "right", "left", "bottom-center", "bottom-right", "bottom-left"], description: "Ray origin" },
    raysColor: { type: "color", default: "#ffffff", description: "Ray color" },
    raysSpeed: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Ray speed" },
    lightSpread: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Light spread" },
    rayLength: { type: "number", default: 2, min: 0.5, max: 6, step: 0.1, description: "Ray length" },
    pulsating: { type: "boolean", default: false, description: "Pulsating" },
    fadeDistance: { type: "number", default: 1.0, min: 0.1, max: 5, step: 0.1, description: "Fade distance" },
    saturation: { type: "number", default: 1.0, min: 0, max: 2, step: 0.05, description: "Saturation" },
    followMouse: { type: "boolean", default: true, description: "Follow mouse" },
    mouseInfluence: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Mouse influence" },
    noiseAmount: { type: "number", default: 0.0, min: 0, max: 1, step: 0.05, description: "Noise amount" },
    distortion: { type: "number", default: 0.0, min: 0, max: 2, step: 0.05, description: "Distortion" },
  },
  defaultParams: { raysOrigin: "top-center", raysColor: "#ffffff", raysSpeed: 1, lightSpread: 1, rayLength: 2, pulsating: false, fadeDistance: 1.0, saturation: 1.0, followMouse: true, mouseInfluence: 0.1, noiseAmount: 0.0, distortion: 0.0 },
  Component: LightRaysComponent,
});

// Grainient
registerBackground({
  id: "grainient",
  name: "Grainient",
  description: "Gradient background with animated film grain overlay",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    color1: { type: "color", default: "#FF9FFC", description: "First gradient color" },
    color2: { type: "color", default: "#5227FF", description: "Second gradient color" },
    timeSpeed: { type: "number", default: 0.25, min: 0, max: 2, step: 0.05, description: "Animation speed" },
    colorBalance: { type: "number", default: 0.0, min: -1, max: 1, step: 0.05, description: "Color balance" },
    warpStrength: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Warp strength" },
    warpFrequency: { type: "number", default: 5.0, min: 0, max: 20, step: 0.5, description: "Warp frequency" },
    warpSpeed: { type: "number", default: 2.0, min: 0, max: 10, step: 0.1, description: "Warp speed" },
    warpAmplitude: { type: "number", default: 50.0, min: 0, max: 200, step: 5, description: "Warp amplitude" },
    blendAngle: { type: "number", default: 0.0, min: -180, max: 180, step: 1, description: "Blend angle (deg)" },
    blendSoftness: { type: "number", default: 0.05, min: 0, max: 1, step: 0.01, description: "Blend softness" },
    rotationAmount: { type: "number", default: 500.0, min: 0, max: 1000, step: 10, description: "Rotation amount" },
    noiseScale: { type: "number", default: 2.0, min: 0.1, max: 10, step: 0.1, description: "Noise scale" },
    grainAmount: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Grain amount" },
    grainScale: { type: "number", default: 2.0, min: 0.1, max: 10, step: 0.1, description: "Grain scale" },
    grainAnimated: { type: "boolean", default: false, description: "Animate grain" },
    contrast: { type: "number", default: 1.5, min: 0.1, max: 4, step: 0.1, description: "Contrast" },
    gamma: { type: "number", default: 1.0, min: 0.1, max: 3, step: 0.05, description: "Gamma" },
    saturation: { type: "number", default: 1.0, min: 0, max: 3, step: 0.05, description: "Saturation" },
    centerX: { type: "number", default: 0.0, min: -1, max: 1, step: 0.05, description: "Center X" },
    centerY: { type: "number", default: 0.0, min: -1, max: 1, step: 0.05, description: "Center Y" },
    zoom: { type: "number", default: 0.9, min: 0.1, max: 3, step: 0.05, description: "Zoom" },
  },
  defaultParams: { color1: "#FF9FFC", color2: "#5227FF", timeSpeed: 0.25, colorBalance: 0.0, warpStrength: 1.0, warpFrequency: 5.0, warpSpeed: 2.0, warpAmplitude: 50.0, blendAngle: 0.0, blendSoftness: 0.05, rotationAmount: 500.0, noiseScale: 2.0, grainAmount: 0.1, grainScale: 2.0, grainAnimated: false, contrast: 1.5, gamma: 1.0, saturation: 1.0, centerX: 0.0, centerY: 0.0, zoom: 0.9 },
  Component: GrainientComponent,
});

// Pixel Blast
registerBackground({
  id: "pixelblast",
  name: "Pixel Blast",
  description: "Pixelated shapes with liquid ripple interaction",
  category: "three",
  dependencies: ["three", "postprocessing"],
  params: {
    variant: { type: "select", default: "square", options: ["square", "circle", "triangle", "diamond"], description: "Pixel shape" },
    pixelSize: { type: "number", default: 3, min: 1, max: 16, step: 1, description: "Pixel size" },
    color: { type: "color", default: "#B497CF", description: "Pixel color" },
    patternScale: { type: "number", default: 2, min: 0.5, max: 10, step: 0.5, description: "Pattern scale" },
    patternDensity: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Pattern density" },
    liquid: { type: "boolean", default: false, description: "Liquid effect" },
    liquidStrength: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Liquid strength" },
    liquidRadius: { type: "number", default: 1, min: 0.1, max: 3, step: 0.1, description: "Liquid radius" },
    pixelSizeJitter: { type: "number", default: 0, min: 0, max: 2, step: 0.05, description: "Pixel size jitter" },
    enableRipples: { type: "boolean", default: true, description: "Enable ripples" },
    rippleIntensityScale: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Ripple intensity" },
    rippleThickness: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Ripple thickness" },
    rippleSpeed: { type: "number", default: 0.3, min: 0, max: 2, step: 0.05, description: "Ripple speed" },
    liquidWobbleSpeed: { type: "number", default: 4.5, min: 0, max: 10, step: 0.5, description: "Liquid wobble speed" },
    speed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Animation speed" },
    transparent: { type: "boolean", default: true, description: "Transparent background" },
    edgeFade: { type: "number", default: 0.5, min: 0, max: 1, step: 0.05, description: "Edge fade" },
    noiseAmount: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Noise amount" },
  },
  defaultParams: { variant: "square", pixelSize: 3, color: "#B497CF", patternScale: 2, patternDensity: 1, liquid: false, liquidStrength: 0.1, liquidRadius: 1, pixelSizeJitter: 0, enableRipples: true, rippleIntensityScale: 1, rippleThickness: 0.1, rippleSpeed: 0.3, liquidWobbleSpeed: 4.5, speed: 0.5, transparent: true, edgeFade: 0.5, noiseAmount: 0 },
  Component: PixelBlastComponent,
});

// Gradient Blinds
registerBackground({
  id: "gradientblinds",
  name: "Gradient Blinds",
  description: "Gradient blinds with spotlight and noise",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    gradientColors: { type: "stringArray", default: ["#FF329F", "#06B6D4"], description: "Gradient colors" },
    angle: { type: "number", default: 0, min: -180, max: 180, step: 1, description: "Gradient angle (deg)" },
    noise: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Noise" },
    blindCount: { type: "number", default: 16, min: 1, max: 60, step: 1, description: "Blind count" },
    blindMinWidth: { type: "number", default: 60, min: 10, max: 200, step: 5, description: "Min blind width" },
    mouseDampening: { type: "number", default: 0.15, min: 0, max: 1, step: 0.01, description: "Mouse dampening" },
    mirrorGradient: { type: "boolean", default: false, description: "Mirror gradient" },
    spotlightRadius: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Spotlight radius" },
    spotlightSoftness: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Spotlight softness" },
    spotlightOpacity: { type: "number", default: 1, min: 0, max: 1, step: 0.05, description: "Spotlight opacity" },
    distortAmount: { type: "number", default: 0, min: 0, max: 2, step: 0.05, description: "Distort amount" },
    shineDirection: { type: "select", default: "left", options: ["left", "right"], description: "Shine direction" },
  },
  defaultParams: { gradientColors: ["#FF329F", "#06B6D4"], angle: 0, noise: 0.3, blindCount: 16, blindMinWidth: 60, mouseDampening: 0.15, mirrorGradient: false, spotlightRadius: 0.5, spotlightSoftness: 1, spotlightOpacity: 1, distortAmount: 0, shineDirection: "left" },
  Component: GradientBlindsComponent,
});

// Hyperspeed — configured via an `effectOptions` object (not flat props), so
// it exposes no inline params; it uses its built-in preset.
registerBackground({
  id: "hyperspeed",
  name: "Hyperspeed",
  description: "Driving through a neon light tunnel at speed",
  category: "three",
  dependencies: ["three", "postprocessing"],
  params: {},
  defaultParams: {},
  Component: HyperspeedComponent,
});

// Galaxy
registerBackground({
  id: "galaxy",
  name: "Galaxy",
  description: "Twinkling star field with density and hue control",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    starSpeed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.1, description: "Star drift speed" },
    density: { type: "number", default: 1, min: 0.1, max: 3, step: 0.1, description: "Star density" },
    hueShift: { type: "number", default: 140, min: 0, max: 360, step: 1, description: "Hue shift" },
    speed: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Animation speed" },
    glowIntensity: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Glow intensity" },
    saturation: { type: "number", default: 0.0, min: 0, max: 1, step: 0.05, description: "Saturation" },
    twinkleIntensity: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Twinkle intensity" },
    rotationSpeed: { type: "number", default: 0.1, min: 0, max: 2, step: 0.05, description: "Rotation speed" },
    repulsionStrength: { type: "number", default: 2, min: 0, max: 10, step: 0.5, description: "Repulsion strength" },
    autoCenterRepulsion: { type: "number", default: 0, min: 0, max: 10, step: 0.5, description: "Auto-center repulsion" },
    disableAnimation: { type: "boolean", default: false, description: "Disable animation" },
    mouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseRepulsion: { type: "boolean", default: true, description: "Mouse repulsion" },
    transparent: { type: "boolean", default: true, description: "Transparent background" },
  },
  defaultParams: { starSpeed: 0.5, density: 1, hueShift: 140, speed: 1.0, glowIntensity: 0.3, saturation: 0.0, twinkleIntensity: 0.3, rotationSpeed: 0.1, repulsionStrength: 2, autoCenterRepulsion: 0, disableAnimation: false, mouseInteraction: true, mouseRepulsion: true, transparent: true },
  Component: GalaxyComponent,
});

// Dot Grid
registerBackground({
  id: "dotgrid",
  name: "Dot Grid",
  description: "Interactive dot grid with shockwave on click",
  category: "canvas2d",
  dependencies: ["gsap"],
  params: {
    dotSize: { type: "number", default: 16, min: 2, max: 40, step: 1, description: "Dot size" },
    gap: { type: "number", default: 32, min: 4, max: 80, step: 1, description: "Gap between dots" },
    baseColor: { type: "color", default: "#5227FF", description: "Base dot color" },
    activeColor: { type: "color", default: "#5227FF", description: "Active dot color" },
    proximity: { type: "number", default: 150, min: 0, max: 500, step: 10, description: "Proximity radius" },
    speedTrigger: { type: "number", default: 100, min: 0, max: 500, step: 10, description: "Speed trigger" },
    shockRadius: { type: "number", default: 250, min: 0, max: 600, step: 10, description: "Shock radius" },
    shockStrength: { type: "number", default: 5, min: 0, max: 20, step: 1, description: "Shock strength" },
    maxSpeed: { type: "number", default: 5000, min: 500, max: 10000, step: 100, description: "Max speed" },
    resistance: { type: "number", default: 750, min: 100, max: 2000, step: 50, description: "Resistance" },
    returnDuration: { type: "number", default: 1.5, min: 0.1, max: 5, step: 0.1, description: "Return duration (s)" },
  },
  defaultParams: { dotSize: 16, gap: 32, baseColor: "#5227FF", activeColor: "#5227FF", proximity: 150, speedTrigger: 100, shockRadius: 250, shockStrength: 5, maxSpeed: 5000, resistance: 750, returnDuration: 1.5 },
  Component: DotGridComponent,
});

// Faulty Terminal
registerBackground({
  id: "faultyterminal",
  name: "Faulty Terminal",
  description: "Glitchy terminal text with scanline artifacts",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    scale: { type: "number", default: 1, min: 0.5, max: 5, step: 0.1, description: "Scale" },
    digitSize: { type: "number", default: 1.5, min: 0.5, max: 5, step: 0.1, description: "Digit size" },
    timeScale: { type: "number", default: 0.3, min: 0, max: 3, step: 0.05, description: "Time scale" },
    scanlineIntensity: { type: "number", default: 0.3, min: 0, max: 1, step: 0.05, description: "Scanline intensity" },
    glitchAmount: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Glitch amount" },
    flickerAmount: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Flicker amount" },
    noiseAmp: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Noise amplitude" },
    chromaticAberration: { type: "number", default: 0, min: 0, max: 5, step: 0.1, description: "Chromatic aberration" },
    dither: { type: "number", default: 0, min: 0, max: 2, step: 0.1, description: "Dither" },
    curvature: { type: "number", default: 0.2, min: 0, max: 1, step: 0.05, description: "Screen curvature" },
    tint: { type: "color", default: "#ffffff", description: "Tint color" },
    mouseReact: { type: "boolean", default: true, description: "Mouse reactive" },
    mouseStrength: { type: "number", default: 0.2, min: 0, max: 1, step: 0.05, description: "Mouse strength" },
    pageLoadAnimation: { type: "boolean", default: true, description: "Page load animation" },
    brightness: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Brightness" },
  },
  defaultParams: { scale: 1, digitSize: 1.5, timeScale: 0.3, scanlineIntensity: 0.3, glitchAmount: 1, flickerAmount: 1, noiseAmp: 1, chromaticAberration: 0, dither: 0, curvature: 0.2, tint: "#ffffff", mouseReact: true, mouseStrength: 0.2, pageLoadAnimation: true, brightness: 1 },
  Component: FaultyTerminalComponent,
});

// Iridescence
registerBackground({
  id: "iridescence",
  name: "Iridescence",
  description: "Rainbow iridescent shader with radial pattern",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Animation speed" },
    amplitude: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Amplitude" },
    mouseReact: { type: "boolean", default: true, description: "Mouse reactive" },
  },
  defaultParams: { speed: 1.0, amplitude: 0.1, mouseReact: true },
  Component: IridescenceComponent,
});

// Light Pillar
registerBackground({
  id: "lightpillar",
  name: "Light Pillar",
  description: "Vertical light pillars with pulsing glow",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    topColor: { type: "color", default: "#5227FF", description: "Top color" },
    bottomColor: { type: "color", default: "#FF9FFC", description: "Bottom color" },
    intensity: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Intensity" },
    rotationSpeed: { type: "number", default: 0.3, min: 0, max: 3, step: 0.05, description: "Rotation speed" },
    interactive: { type: "boolean", default: false, description: "Mouse interactive" },
    glowAmount: { type: "number", default: 0.005, min: 0, max: 0.05, step: 0.001, description: "Glow amount" },
    pillarWidth: { type: "number", default: 3.0, min: 0.5, max: 8, step: 0.1, description: "Pillar width" },
    pillarHeight: { type: "number", default: 0.4, min: 0.1, max: 2, step: 0.05, description: "Pillar height" },
    noiseIntensity: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Noise intensity" },
    pillarRotation: { type: "number", default: 0, min: -180, max: 180, step: 1, description: "Pillar rotation (deg)" },
    quality: { type: "select", default: "high", options: ["low", "medium", "high"], description: "Render quality" },
  },
  defaultParams: { topColor: "#5227FF", bottomColor: "#FF9FFC", intensity: 1.0, rotationSpeed: 0.3, interactive: false, glowAmount: 0.005, pillarWidth: 3.0, pillarHeight: 0.4, noiseIntensity: 0.5, pillarRotation: 0, quality: "high" },
  Component: LightPillarComponent,
});

// Lightfall
registerBackground({
  id: "lightfall",
  name: "Lightfall",
  description: "Falling streaks of light like digital rain",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    colors: { type: "stringArray", default: ["#A6C8FF", "#5227FF", "#FF9FFC"], description: "Streak colors" },
    speed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Fall speed" },
    streakCount: { type: "number", default: 2, min: 1, max: 10, step: 1, description: "Streak count" },
    streakWidth: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Streak width" },
    streakLength: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Streak length" },
    glow: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Glow" },
    density: { type: "number", default: 0.6, min: 0, max: 1, step: 0.05, description: "Density" },
    twinkle: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Twinkle" },
    zoom: { type: "number", default: 3, min: 0.5, max: 8, step: 0.5, description: "Zoom" },
    backgroundGlow: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Background glow" },
    mouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseStrength: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Mouse strength" },
    mouseRadius: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Mouse radius" },
    mouseDampening: { type: "number", default: 0.15, min: 0, max: 1, step: 0.01, description: "Mouse dampening" },
  },
  defaultParams: { colors: ["#A6C8FF", "#5227FF", "#FF9FFC"], speed: 0.5, streakCount: 2, streakWidth: 1, streakLength: 1, glow: 1, density: 0.6, twinkle: 1, zoom: 3, backgroundGlow: 0.5, mouseInteraction: true, mouseStrength: 0.5, mouseRadius: 1, mouseDampening: 0.15 },
  Component: LightfallComponent,
});

// Side Rays
registerBackground({
  id: "siderays",
  name: "Side Rays",
  description: "Corner-anchored volumetric light rays",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 2.5, min: 0, max: 8, step: 0.1, description: "Animation speed" },
    rayColor1: { type: "color", default: "#EAB308", description: "First ray color" },
    rayColor2: { type: "color", default: "#96c8ff", description: "Second ray color" },
    intensity: { type: "number", default: 2, min: 0, max: 5, step: 0.1, description: "Intensity" },
    spread: { type: "number", default: 2, min: 0.1, max: 6, step: 0.1, description: "Spread" },
    origin: { type: "select", default: "top-right", options: ["top-right", "top-left", "bottom-right", "bottom-left"], description: "Ray origin" },
    tilt: { type: "number", default: 0, min: -90, max: 90, step: 1, description: "Tilt (deg)" },
    saturation: { type: "number", default: 1.5, min: 0, max: 3, step: 0.05, description: "Saturation" },
    blend: { type: "number", default: 0.75, min: 0, max: 1, step: 0.05, description: "Blend" },
    falloff: { type: "number", default: 1.6, min: 0.1, max: 5, step: 0.1, description: "Falloff" },
  },
  defaultParams: { speed: 2.5, rayColor1: "#EAB308", rayColor2: "#96c8ff", intensity: 2, spread: 2, origin: "top-right", tilt: 0, saturation: 1.5, blend: 0.75, falloff: 1.6 },
  Component: SideRaysComponent,
});

// Line Waves
registerBackground({
  id: "linewaves",
  name: "Line Waves",
  description: "Concentric line waves with warp and color cycling",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 0.3, min: 0, max: 3, step: 0.05, description: "Animation speed" },
    innerLineCount: { type: "number", default: 32, min: 4, max: 100, step: 1, description: "Inner line count" },
    outerLineCount: { type: "number", default: 36, min: 4, max: 100, step: 1, description: "Outer line count" },
    warpIntensity: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Warp intensity" },
    rotation: { type: "number", default: -45, min: -180, max: 180, step: 1, description: "Rotation (deg)" },
    edgeFadeWidth: { type: "number", default: 0.0, min: 0, max: 1, step: 0.05, description: "Edge fade width" },
    colorCycleSpeed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Color cycle speed" },
    brightness: { type: "number", default: 0.2, min: 0, max: 2, step: 0.05, description: "Brightness" },
    color1: { type: "color", default: "#ffffff", description: "Color 1" },
    color2: { type: "color", default: "#ffffff", description: "Color 2" },
    color3: { type: "color", default: "#ffffff", description: "Color 3" },
    enableMouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseInfluence: { type: "number", default: 2.0, min: 0, max: 5, step: 0.1, description: "Mouse influence" },
  },
  defaultParams: { speed: 0.3, innerLineCount: 32, outerLineCount: 36, warpIntensity: 1.0, rotation: -45, edgeFadeWidth: 0.0, colorCycleSpeed: 1.0, brightness: 0.2, color1: "#ffffff", color2: "#ffffff", color3: "#ffffff", enableMouseInteraction: true, mouseInfluence: 2.0 },
  Component: LineWavesComponent,
});

// Orb
registerBackground({
  id: "orb",
  name: "Orb",
  description: "Glowing orb with hover rotation and distortion",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    hue: { type: "number", default: 0, min: 0, max: 360, step: 1, description: "Hue" },
    hoverIntensity: { type: "number", default: 0.2, min: 0, max: 2, step: 0.05, description: "Hover intensity" },
    rotateOnHover: { type: "boolean", default: true, description: "Rotate on hover" },
    forceHoverState: { type: "boolean", default: false, description: "Force hover state" },
  },
  defaultParams: { hue: 0, hoverIntensity: 0.2, rotateOnHover: true, forceHoverState: false },
  Component: OrbComponent,
});

// Prism
registerBackground({
  id: "prism",
  name: "Prism",
  description: "Rotating prism with chromatic dispersion",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    height: { type: "number", default: 3.5, min: 0.5, max: 8, step: 0.1, description: "Prism height" },
    baseWidth: { type: "number", default: 5.5, min: 0.5, max: 10, step: 0.1, description: "Base width" },
    animationType: { type: "select", default: "rotate", options: ["rotate", "hover", "3drotate"], description: "Animation type" },
    glow: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Glow" },
    noise: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Noise" },
    transparent: { type: "boolean", default: true, description: "Transparent background" },
    scale: { type: "number", default: 3.6, min: 0.5, max: 8, step: 0.1, description: "Scale" },
    hueShift: { type: "number", default: 0, min: 0, max: 360, step: 1, description: "Hue shift" },
    colorFrequency: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Color frequency" },
    hoverStrength: { type: "number", default: 2, min: 0, max: 6, step: 0.1, description: "Hover strength" },
    inertia: { type: "number", default: 0.05, min: 0, max: 1, step: 0.01, description: "Inertia" },
    bloom: { type: "number", default: 1, min: 0, max: 3, step: 0.1, description: "Bloom" },
    timeScale: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Time scale" },
  },
  defaultParams: { height: 3.5, baseWidth: 5.5, animationType: "rotate", glow: 1, noise: 0.5, transparent: true, scale: 3.6, hueShift: 0, colorFrequency: 1, hoverStrength: 2, inertia: 0.05, bloom: 1, timeScale: 0.5 },
  Component: PrismComponent,
});

// Prismatic Burst
registerBackground({
  id: "prismaticburst",
  name: "Prismatic Burst",
  description: "Bursting prismatic rays from center with color gradient",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    intensity: { type: "number", default: 2, min: 0, max: 6, step: 0.1, description: "Intensity" },
    speed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Animation speed" },
    animationType: { type: "select", default: "rotate3d", options: ["rotate", "rotate3d", "hover"], description: "Animation type" },
    colors: { type: "stringArray", default: ["#5227FF", "#FF9FFC", "#B497CF"], description: "Burst colors" },
    distort: { type: "number", default: 0, min: 0, max: 10, step: 0.5, description: "Distortion" },
    hoverDampness: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Hover dampness" },
    rayCount: { type: "number", default: 0, min: 0, max: 32, step: 1, description: "Ray count (0 = auto)" },
  },
  defaultParams: { intensity: 2, speed: 0.5, animationType: "rotate3d", colors: ["#5227FF", "#FF9FFC", "#B497CF"], distort: 0, hoverDampness: 0, rayCount: 0 },
  Component: PrismaticBurstComponent,
});

// Liquid Ether
registerBackground({
  id: "liquidether",
  name: "Liquid Ether",
  description: "Fluid simulation with flowing color blending",
  category: "three",
  dependencies: ["three"],
  params: {
    colors: { type: "stringArray", default: ["#5227FF", "#FF9FFC", "#B497CF"], description: "Fluid colors" },
    mouseForce: { type: "number", default: 20, min: 0, max: 100, step: 1, description: "Mouse force" },
    cursorSize: { type: "number", default: 100, min: 10, max: 300, step: 10, description: "Cursor size" },
    isViscous: { type: "boolean", default: false, description: "Viscous fluid" },
    viscous: { type: "number", default: 30, min: 0, max: 100, step: 1, description: "Viscosity" },
    iterationsViscous: { type: "number", default: 32, min: 1, max: 64, step: 1, description: "Viscous iterations" },
    iterationsPoisson: { type: "number", default: 32, min: 1, max: 64, step: 1, description: "Poisson iterations" },
    dt: { type: "number", default: 0.014, min: 0.001, max: 0.05, step: 0.001, description: "Timestep" },
    BFECC: { type: "boolean", default: true, description: "BFECC advection" },
    resolution: { type: "number", default: 0.5, min: 0.1, max: 1, step: 0.05, description: "Resolution" },
    isBounce: { type: "boolean", default: false, description: "Bounce at edges" },
    autoDemo: { type: "boolean", default: true, description: "Auto demo motion" },
    autoSpeed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.1, description: "Auto speed" },
    autoIntensity: { type: "number", default: 2.2, min: 0, max: 5, step: 0.1, description: "Auto intensity" },
    takeoverDuration: { type: "number", default: 0.25, min: 0, max: 2, step: 0.05, description: "Takeover duration" },
    autoResumeDelay: { type: "number", default: 1000, min: 0, max: 5000, step: 100, description: "Auto resume delay (ms)" },
    autoRampDuration: { type: "number", default: 0.6, min: 0, max: 3, step: 0.1, description: "Auto ramp duration" },
  },
  defaultParams: { colors: ["#5227FF", "#FF9FFC", "#B497CF"], mouseForce: 20, cursorSize: 100, isViscous: false, viscous: 30, iterationsViscous: 32, iterationsPoisson: 32, dt: 0.014, BFECC: true, resolution: 0.5, isBounce: false, autoDemo: true, autoSpeed: 0.5, autoIntensity: 2.2, takeoverDuration: 0.25, autoResumeDelay: 1000, autoRampDuration: 0.6 },
  Component: LiquidEtherComponent,
});

// Plasma
registerBackground({
  id: "plasma",
  name: "Plasma",
  description: "Organic plasma blobs with mouse interaction",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    color: { type: "color", default: "#ffffff", description: "Plasma color" },
    speed: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Animation speed" },
    direction: { type: "select", default: "forward", options: ["forward", "reverse", "pingpong"], description: "Direction" },
    scale: { type: "number", default: 1, min: 0.1, max: 5, step: 0.1, description: "Scale" },
    mouseInteractive: { type: "boolean", default: true, description: "Mouse interactive" },
  },
  defaultParams: { color: "#ffffff", speed: 1, direction: "forward", scale: 1, mouseInteractive: true },
  Component: PlasmaComponent,
});

// Balatro
registerBackground({
  id: "balatro",
  name: "Balatro",
  description: "Swirling psychedelic paint shader",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    spinRotation: { type: "number", default: -2.0, min: -10, max: 10, step: 0.1, description: "Spin rotation" },
    spinSpeed: { type: "number", default: 7.0, min: 0, max: 20, step: 0.5, description: "Spin speed" },
    color1: { type: "color", default: "#DE443B", description: "Color 1" },
    color2: { type: "color", default: "#006BB4", description: "Color 2" },
    color3: { type: "color", default: "#162325", description: "Color 3" },
    contrast: { type: "number", default: 3.5, min: 0, max: 10, step: 0.1, description: "Contrast" },
    lighting: { type: "number", default: 0.4, min: 0, max: 2, step: 0.05, description: "Lighting" },
    spinAmount: { type: "number", default: 0.25, min: 0, max: 1, step: 0.05, description: "Spin amount" },
    pixelFilter: { type: "number", default: 745.0, min: 100, max: 2000, step: 5, description: "Pixel filter" },
    spinEase: { type: "number", default: 1.0, min: 0, max: 3, step: 0.1, description: "Spin ease" },
    isRotate: { type: "boolean", default: false, description: "Continuous rotate" },
    mouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
  },
  defaultParams: { spinRotation: -2.0, spinSpeed: 7.0, color1: "#DE443B", color2: "#006BB4", color3: "#162325", contrast: 3.5, lighting: 0.4, spinAmount: 0.25, pixelFilter: 745.0, spinEase: 1.0, isRotate: false, mouseInteraction: true },
  Component: BalatroComponent,
});

// Liquid Chrome
registerBackground({
  id: "liquidchrome",
  name: "Liquid Chrome",
  description: "Chrome-like metallic distortion shader",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    speed: { type: "number", default: 0.2, min: 0, max: 2, step: 0.05, description: "Animation speed" },
    amplitude: { type: "number", default: 0.5, min: 0, max: 2, step: 0.05, description: "Amplitude" },
    frequencyX: { type: "number", default: 3, min: 0.5, max: 10, step: 0.5, description: "Frequency X" },
    frequencyY: { type: "number", default: 2, min: 0.5, max: 10, step: 0.5, description: "Frequency Y" },
    interactive: { type: "boolean", default: true, description: "Mouse interactive" },
  },
  defaultParams: { speed: 0.2, amplitude: 0.5, frequencyX: 3, frequencyY: 2, interactive: true },
  Component: LiquidChromeComponent,
});

// Evil Eye
registerBackground({
  id: "evileye",
  name: "Evil Eye",
  description: "Mystic eye with iris, pupil, and floating glow",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    eyeColor: { type: "color", default: "#FF6F37", description: "Eye color" },
    intensity: { type: "number", default: 1.5, min: 0, max: 4, step: 0.1, description: "Intensity" },
    pupilSize: { type: "number", default: 0.6, min: 0.1, max: 1, step: 0.05, description: "Pupil size" },
    irisWidth: { type: "number", default: 0.25, min: 0.05, max: 1, step: 0.01, description: "Iris width" },
    glowIntensity: { type: "number", default: 0.35, min: 0, max: 2, step: 0.05, description: "Glow intensity" },
    scale: { type: "number", default: 0.8, min: 0.1, max: 2, step: 0.05, description: "Scale" },
    noiseScale: { type: "number", default: 1.0, min: 0.1, max: 5, step: 0.1, description: "Noise scale" },
    pupilFollow: { type: "number", default: 1.0, min: 0, max: 2, step: 0.05, description: "Pupil follow" },
    flameSpeed: { type: "number", default: 1.0, min: 0, max: 5, step: 0.1, description: "Flame speed" },
  },
  defaultParams: { eyeColor: "#FF6F37", intensity: 1.5, pupilSize: 0.6, irisWidth: 0.25, glowIntensity: 0.35, scale: 0.8, noiseScale: 1.0, pupilFollow: 1.0, flameSpeed: 1.0 },
  Component: EvilEyeComponent,
});

// Ballpit
registerBackground({
  id: "ballpit",
  name: "Ballpit",
  description: "Bouncing gradient spheres with physics",
  category: "three",
  dependencies: ["three"],
  params: {
    count: { type: "number", default: 200, min: 10, max: 500, step: 10, description: "Ball count" },
    gravity: { type: "number", default: 0.5, min: 0, max: 3, step: 0.1, description: "Gravity" },
    friction: { type: "number", default: 0.9975, min: 0.9, max: 1, step: 0.0005, description: "Friction" },
    wallBounce: { type: "number", default: 0.95, min: 0, max: 1, step: 0.05, description: "Wall bounce" },
    maxVelocity: { type: "number", default: 0.15, min: 0.01, max: 1, step: 0.01, description: "Max velocity" },
    minSize: { type: "number", default: 0.5, min: 0.1, max: 2, step: 0.1, description: "Min ball size" },
    maxSize: { type: "number", default: 1, min: 0.2, max: 3, step: 0.1, description: "Max ball size" },
    followCursor: { type: "boolean", default: true, description: "Follow cursor" },
  },
  defaultParams: { count: 200, gravity: 0.5, friction: 0.9975, wallBounce: 0.95, maxVelocity: 0.15, minSize: 0.5, maxSize: 1, followCursor: true },
  Component: BallpitComponent,
});

// Ferrofluid
registerBackground({
  id: "ferrofluid",
  name: "Ferrofluid",
  description: "Spiky magnetic fluid blob with pulsing spikes",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    colors: { type: "stringArray", default: ["#ffffff", "#ffffff", "#ffffff"], description: "Fluid colors" },
    speed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Animation speed" },
    scale: { type: "number", default: 1.6, min: 0.1, max: 5, step: 0.1, description: "Scale" },
    turbulence: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Turbulence" },
    fluidity: { type: "number", default: 0.1, min: 0, max: 1, step: 0.05, description: "Fluidity" },
    rimWidth: { type: "number", default: 0.2, min: 0, max: 1, step: 0.05, description: "Rim width" },
    sharpness: { type: "number", default: 2.5, min: 0, max: 6, step: 0.1, description: "Sharpness" },
    shimmer: { type: "number", default: 1.5, min: 0, max: 5, step: 0.1, description: "Shimmer" },
    glow: { type: "number", default: 2, min: 0, max: 5, step: 0.1, description: "Glow" },
    flowDirection: { type: "select", default: "down", options: ["up", "down", "left", "right"], description: "Flow direction" },
    mouseInteraction: { type: "boolean", default: true, description: "Mouse interactive" },
    mouseStrength: { type: "number", default: 1, min: 0, max: 5, step: 0.1, description: "Mouse strength" },
    mouseRadius: { type: "number", default: 0.35, min: 0, max: 2, step: 0.05, description: "Mouse radius" },
    mouseDampening: { type: "number", default: 0.15, min: 0, max: 1, step: 0.01, description: "Mouse dampening" },
  },
  defaultParams: { colors: ["#ffffff", "#ffffff", "#ffffff"], speed: 0.5, scale: 1.6, turbulence: 1, fluidity: 0.1, rimWidth: 0.2, sharpness: 2.5, shimmer: 1.5, glow: 2, flowDirection: "down", mouseInteraction: true, mouseStrength: 1, mouseRadius: 0.35, mouseDampening: 0.15 },
  Component: FerrofluidComponent,
});

// Dark Veil
registerBackground({
  id: "darkveil",
  name: "Dark Veil",
  description: "Dark animated veil with hue shift and scanlines",
  category: "webgl",
  dependencies: ["ogl"],
  params: {
    hueShift: { type: "number", default: 0, min: 0, max: 360, step: 1, description: "Hue shift" },
    noiseIntensity: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Noise intensity" },
    scanlineIntensity: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Scanline intensity" },
    speed: { type: "number", default: 0.5, min: 0, max: 3, step: 0.05, description: "Animation speed" },
    scanlineFrequency: { type: "number", default: 0, min: 0, max: 5, step: 0.1, description: "Scanline frequency" },
    warpAmount: { type: "number", default: 0, min: 0, max: 5, step: 0.1, description: "Warp amount" },
    resolutionScale: { type: "number", default: 1, min: 0.25, max: 2, step: 0.05, description: "Resolution scale" },
  },
  defaultParams: { hueShift: 0, noiseIntensity: 0, scanlineIntensity: 0, speed: 0.5, scanlineFrequency: 0, warpAmount: 0, resolutionScale: 1 },
  Component: DarkVeilComponent,
});

// Grid Distortion
registerBackground({
  id: "griddistortion",
  name: "Grid Distortion",
  description: "Warped grid with mouse-driven ripple distortion",
  category: "three",
  dependencies: ["three"],
  params: {
    grid: { type: "number", default: 15, min: 2, max: 40, step: 1, description: "Grid resolution" },
    mouse: { type: "number", default: 0.1, min: 0, max: 1, step: 0.01, description: "Mouse radius" },
    strength: { type: "number", default: 0.15, min: 0, max: 1, step: 0.01, description: "Distortion strength" },
    relaxation: { type: "number", default: 0.9, min: 0.5, max: 1, step: 0.01, description: "Relaxation" },
  },
  defaultParams: { grid: 15, mouse: 0.1, strength: 0.15, relaxation: 0.9 },
  Component: GridDistortionComponent,
});

/**
 * Register a background component in the catalog.
 */
export function registerBackground(entry: BackgroundComponentEntry): void {
  componentMap.set(entry.id, entry);
  // Also add to catalog array for iteration
  const existingIndex = BACKGROUND_CATALOG.findIndex((b) => b.id === entry.id);
  if (existingIndex >= 0) {
    BACKGROUND_CATALOG[existingIndex] = entry;
  } else {
    BACKGROUND_CATALOG.push(entry);
  }
}

/**
 * Get a background component by ID.
 */
export function getBackground(
  id: string,
): BackgroundComponentEntry | undefined {
  return componentMap.get(id);
}

/**
 * Check if a background exists.
 */
export function hasBackground(id: string): boolean {
  return componentMap.has(id);
}

/**
 * Get all backgrounds.
 */
export function getAllBackgrounds(): BackgroundDef[] {
  return [...BACKGROUND_CATALOG];
}

/**
 * Get backgrounds by category.
 */
export function getBackgroundsByCategory(
  category: BackgroundDef["category"],
): BackgroundDef[] {
  return BACKGROUND_CATALOG.filter((b) => b.category === category);
}

/**
 * Merge default params with user-provided params.
 * Always includes the global layer params (backgroundColor / opacity /
 * blendMode) so they are surfaced in the editor and forwarded into exports.
 */
export function mergeParams(
  def: BackgroundDef,
  userParams: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(def.params)) {
    merged[key] = userParams[key] ?? def.defaultParams[key] ?? schema.default;
  }
  for (const [key, schema] of Object.entries(GLOBAL_BACKGROUND_PARAMS)) {
    merged[key] = userParams[key] ?? schema.default;
  }
  return merged;
}
