const MAX = 140;

/** Pure: derive a one-line summary from a design.md. No network. */
export function deriveSummary(designMd: string): string {
  const lines = designMd.split("\n");
  const dlIdx = lines.findIndex((l) => /^#{1,6}\s+design language/i.test(l.trim()));
  const pools: string[][] = [];
  if (dlIdx !== -1) pools.push(lines.slice(dlIdx + 1));
  pools.push(lines);
  for (const pool of pools) {
    for (const raw of pool) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      return cap(line);
    }
  }
  return "";
}

function cap(s: string): string {
  if (s.length <= MAX) return s;
  const slice = s.slice(0, MAX);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}
