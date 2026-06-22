import { parseDesignTokens } from "../styles/parse";

export function StyleSwatch({ designMd }: { designMd: string }) {
  const { colors, fonts } = parseDesignTokens(designMd);
  const palette = colors.length ? colors : ["#161618", "#26262a", "#6B57EE"];
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-surface p-3">
      <div className="flex gap-1">
        {palette.slice(0, 6).map((c, i) => (
          <span key={i} className="h-6 flex-1 rounded-sm" style={{ background: c }} />
        ))}
      </div>
      <div className="text-2xl font-bold text-text" style={{ fontFamily: fonts[0] }}>
        Aa
      </div>
      <div className="text-xs text-text-muted" style={{ fontFamily: fonts[1] }}>
        {fonts.length ? fonts.join(" · ") : "Design language"}
      </div>
    </div>
  );
}