# Divsigner

**Design-as-code poster generator.** Describe a poster in plain language, pick a style, and an LLM generates a self-contained HTML/CSS poster you can preview, edit, and export as a PNG — no image-generation models involved. Design quality comes from curated style presets, not pixel diffusion.

## How it works

Divsigner is a static single-page app (Vite + React + TypeScript + Tailwind). All state — your API key, provider config, and generation history — lives in your browser's `localStorage`; nothing is sent to a Divsigner server. A single stateless edge-function relay (`api/relay.ts`) exists only to bypass CORS when talking to model providers; it forwards your API key from the request headers and never stores it.

The model returns a complete, self-contained HTML document. Divsigner renders it in a sandboxed preview, lets you tweak the code directly (CodeMirror), and exports a high-resolution PNG.

## Features

- Prompt-to-poster generation via any OpenAI-compatible or Anthropic API
- Curated style presets for premium, intentional design output
- Live, editable HTML/CSS preview with a built-in code editor
- A rich library of animated/generative background treatments (Three.js / OGL / shaders)
- One-click PNG export
- Generation history, all stored locally

## Providers

Supports **OpenAI** and **Anthropic** out of the box, plus any custom OpenAI-compatible endpoint. You enter your own API key directly in the app's UI — it is stored only in your browser.

## Getting started

```bash
npm install
npm run dev
```

Then open the dev server URL, open Settings, choose a provider, and paste your API key.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run the test suite (Vitest) |

## Deployment

The app deploys as a static site with one edge function for the relay. Configuration is included for both:

- **Vercel** — `vercel.json` (edge runtime for `api/relay.ts`)
- **Netlify** — `netlify.toml` (edge function at `/api/relay`)

No server-side environment variables are required; keys are provided by users at runtime.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS · Three.js / @react-three/fiber · OGL · GSAP · CodeMirror · html-to-image

## License

[MIT](./LICENSE)
