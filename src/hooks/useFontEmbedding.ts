import { useState, useEffect, useCallback } from "react";
import { FONT_PATHS, WHITELISTED_FONTS } from "../utils/constants";

export function useFontEmbedding() {
  const [fontEmbedCSS, setFontEmbedCSS] = useState("");
  const [fontsReady, setFontsReady] = useState(false);

  const computeFontEmbedCSS = useCallback(async (): Promise<string> => {
    const cssParts: string[] = [];

    for (const fontFamily of WHITELISTED_FONTS) {
      const paths = FONT_PATHS[fontFamily] ?? [];
      for (const path of paths) {
        try {
          const response = await fetch(path);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          const weightMatch = path.match(/-(\d+)\.woff2$/);
          const weight = weightMatch?.[1] ?? "400";

          cssParts.push(`@font-face {
  font-family: "${fontFamily}";
  font-style: normal;
  font-weight: ${weight};
  src: url(${base64}) format("woff2");
}`);
        } catch {
          // Font file not available — skip
        }
      }
    }

    return cssParts.join("\n");
  }, []);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsReady(true);
      computeFontEmbedCSS().then(setFontEmbedCSS);
    });
  }, [computeFontEmbedCSS]);

  const awaitFontsReady = useCallback(async (): Promise<void> => {
    await document.fonts.ready;
    setFontsReady(true);
  }, []);

  return { fontEmbedCSS, fontsReady, awaitFontsReady };
}