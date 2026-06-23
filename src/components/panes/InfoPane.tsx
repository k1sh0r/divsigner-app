import { Badge } from "../ui/ds";

interface InfoPaneProps {
  info: {
    prompt: string;
    styleName: string;
    aspectRatio: string;
    count: number;
    thinking: string;
    output: string;
  } | null;
}

export function InfoPane({ info }: InfoPaneProps) {
  if (!info) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-center text-sm text-text-faint animate-[fadeIn_300ms_ease]">
        Focus a design to see its prompt, preferences, and live model output.
      </div>
    );
  }

  const hasOutput = info.thinking.trim() || info.output.trim();

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <div className="eyebrow mb-2">Prompt &amp; preferences</div>
        <div className="text-sm text-text leading-relaxed">
          {info.prompt || <span className="text-text-faint">No prompt</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="accent">{info.styleName}</Badge>
          <Badge variant="neutral">{info.aspectRatio}</Badge>
          <Badge variant="neutral">{info.count} {info.count === 1 ? "variant" : "variants"}</Badge>
        </div>
      </div>

      <div>
        <div className="eyebrow mb-2">Model thinking / output</div>
        {hasOutput ? (
          <pre
            className="scroll-thin overflow-auto font-mono text-xs text-text-muted"
            style={{
              background: "rgba(7,6,12,0.6)",
              boxShadow: "inset 0 0 0 1px var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3)",
              maxHeight: 320,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {info.thinking.trim() ? `— thinking —\n${info.thinking}\n\n— output —\n` : ""}
            {info.output || "(no output yet)"}
          </pre>
        ) : (
          <div className="text-sm text-text-faint">No model output yet.</div>
        )}
      </div>
    </div>
  );
}