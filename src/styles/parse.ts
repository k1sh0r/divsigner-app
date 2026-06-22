export interface ParsedTokens {
  colors: string[]; // hex strings, original casing of first occurrence
  fonts: string[];
}

export function parseDesignTokens(md: string): ParsedTokens {
  if (!md) return { colors: [], fonts: [] };

  const colors: string[] = [];
  const seen = new Set<string>();
  for (const m of md.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const key = m[0].toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      colors.push(m[0]);
    }
    if (colors.length >= 8) break;
  }

  const fonts: string[] = [];
  const fseen = new Set<string>();
  const add = (name: string) => {
    const n = name.trim().replace(/['"]/g, "");
    if (n && !fseen.has(n.toLowerCase())) {
      fseen.add(n.toLowerCase());
      fonts.push(n);
    }
  };
  for (const m of md.matchAll(/font-family\s*:?\s*["']?([A-Za-z][A-Za-z0-9 ]+)["']?/gi))
    add(m[1]!);
  // common whitelisted families mentioned in prose
  for (const fam of ["Archivo", "JetBrains Mono", "Playfair Display", "Inter", "Space Grotesk"])
    if (new RegExp(`\\b${fam}\\b`, "i").test(md)) add(fam);

  return { colors, fonts: fonts.slice(0, 4) };
}