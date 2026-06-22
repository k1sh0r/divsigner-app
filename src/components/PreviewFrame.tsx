import { useEffect, useRef, useState } from "react";
import type { AspectRatioKey } from "../utils/constants";
import { ASPECT_RATIOS } from "../utils/constants";
import { resolveAssets, type AssetMap } from "../utils/assets";

interface PreviewFrameProps {
  html: string;
  aspectRatio: AspectRatioKey;
  /** Base64 @font-face CSS for the self-hosted fonts, inlined so the
   * blob-URL document is fully self-contained (blob origin can't load
   * /fonts/ paths). */
  fontEmbedCSS: string;
  /** Embedded-asset lookup; `asset://<id>` tokens resolve to data URLs. */
  assets?: AssetMap;
}

/** Inject inline base64 font CSS into an HTML document's head. */
function withFonts(html: string, fontCSS: string): string {
  const tag = `<style>${fontCSS}</style>`;
  if (html.includes("</head>")) return html.replace("</head>", `${tag}</head>`);
  if (html.includes("<body")) return html.replace("<body", `${tag}<body`);
  return tag + html;
}

export function PreviewFrame({
  html,
  aspectRatio,
  fontEmbedCSS,
  assets,
}: PreviewFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dims = ASPECT_RATIOS[aspectRatio];
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [blobUrl, setBlobUrl] = useState("");

  // A Blob URL renders the HTML as a real standalone document — identical
  // to opening the file in a new tab — avoiding srcdoc/sandbox blank-render
  // quirks. Fonts are inlined so the opaque blob origin needs no /fonts/.
  // Created inside the effect so each invocation owns (and revokes) its own
  // URL — survives StrictMode's double-invoke without revoking a live URL.
  useEffect(() => {
    const full = withFonts(resolveAssets(html, assets ?? {}), fontEmbedCSS);
    const url = URL.createObjectURL(new Blob([full], { type: "text/html" }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [html, fontEmbedCSS, assets]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale =
    box.w && box.h ? Math.min(box.w / dims.width, box.h / dims.height) : 0;

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center">
      {scale > 0 && blobUrl && (
        <div
          style={{
            width: dims.width * scale,
            height: dims.height * scale,
            overflow: "hidden",
            boxShadow: "0 24px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          <iframe
            key={blobUrl}
            src={blobUrl}
            title="Poster Preview"
            allowTransparency
            style={{
              width: dims.width,
              height: dims.height,
              border: "none",
              backgroundColor: "transparent",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              // Static poster (no scripts) — let wheel/touch pass through to
              // the scroll container so the feed scrolls and pull-to-new works.
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
