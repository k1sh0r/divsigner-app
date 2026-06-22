import { useRef, useState } from "react";
import { ChevronDownIcon } from "./ui/icons";
import type { ProviderConfig } from "../providers/types";
import { extractDesignMdFromUrl } from "../styles/import";
import { deriveSummary } from "../styles/summary";

const MAX_DESIGN_MD = 20_000;

export interface StyleImportValue {
  name: string;
  summary: string;
  designMd: string;
  origin: { kind: "paste" | "upload" | "url"; ref?: string };
}

const field =
  "w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-text " +
  "placeholder:text-text-muted/60 focus:outline-none focus:border-accent transition-colors";
const label = "block text-sm font-semibold text-text mb-2";

export function StyleImportForm({
  config, initial, onSave, onDelete,
}: {
  config: ProviderConfig;
  initial?: Partial<StyleImportValue>;
  onSave: (v: StyleImportValue) => void;
  /** Present for existing custom styles — renders a Delete button. */
  onDelete?: () => void;
}) {
  const init = {
    name: initial?.name ?? "",
    summary: initial?.summary ?? "",
    designMd: initial?.designMd ?? "",
  };
  const [name, setName] = useState(init.name);
  const [designMd, setDesignMd] = useState(init.designMd);
  const [summary, setSummary] = useState(init.summary);
  const [summaryEdited, setSummaryEdited] = useState(Boolean(initial?.summary));
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Replace textarea content, auto-deriving summary + guarding existing work.
  const setDesignSafely = (next: string, srcName?: string) => {
    if (designMd.trim() && !window.confirm("Replace the current design.md content?")) return;
    setDesignMd(next);
    if (!summaryEdited) setSummary(deriveSummary(next));
    if (!name && srcName) setName(srcName);
  };

  const onTextarea = (v: string) => {
    setDesignMd(v);
    if (!summaryEdited) setSummary(deriveSummary(v));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setDesignSafely(reader.result as string, file.name.replace(/\.(md|markdown|txt)$/, ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExtract = async () => {
    setFetching(true); setError(""); setOk(false);
    try {
      const md = await extractDesignMdFromUrl(urlInput, config);
      setDesignSafely(md);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract from URL");
    } finally {
      setFetching(false);
    }
  };

  const dirty =
    name !== init.name || designMd !== init.designMd || summary !== init.summary;
  const canSave = designMd.trim().length > 0 && dirty;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim() || "Custom style",
      summary: summary.trim(),
      designMd: designMd.trim(),
      origin: { kind: urlInput ? "url" : "paste", ref: urlInput.trim() || undefined },
    });
  };

  const over = designMd.length > MAX_DESIGN_MD * 0.9;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className={label}>Name</label>
        <input className={field} value={name} placeholder="My custom style"
          onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className={label + " mb-0"}>design.md</label>
          <span className={`text-xs tabular-nums ${over ? "text-danger" : "text-text-muted"}`}>
            {designMd.length.toLocaleString()} / {MAX_DESIGN_MD.toLocaleString()}
          </span>
        </div>
        <textarea
          value={designMd}
          onChange={(e) => onTextarea(e.target.value)}
          rows={12}
          placeholder="Paste your design.md content here…"
          className={`${field} font-mono text-xs resize-none`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt"
            onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-text hover:border-accent transition-colors">
            Import design.md
          </button>
          <button onClick={() => setUrlOpen((o) => !o)}
            aria-expanded={urlOpen}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-text hover:border-accent transition-colors">
            From website
            <ChevronDownIcon size={12} className={`transition-transform ${urlOpen ? "" : "-rotate-90"}`} />
          </button>
        </div>

        <div className={`grid transition-all duration-200 ${urlOpen ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="flex gap-2">
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                disabled={fetching} placeholder="https://example.com" className={field} />
              <button onClick={handleExtract} disabled={fetching || !urlInput.trim()}
                className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {fetching ? "Extracting…" : "Extract"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            {ok && !error && <p className="mt-2 text-xs text-success">Extracted into design.md.</p>}
          </div>
        </div>
      </div>

      <div>
        <label className={label}>Summary</label>
        <input className={field} value={summary} placeholder="One-line description"
          onChange={(e) => { setSummary(e.target.value); setSummaryEdited(true); }} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        {onDelete ? (
          <button onClick={onDelete}
            className="rounded-md border border-border px-4 py-2 text-sm text-danger hover:border-danger transition-colors">
            Delete
          </button>
        ) : <span />}
        {canSave && (
          <button onClick={handleSave}
            className="rounded-md bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-hover transition-colors">
            Save style
          </button>
        )}
      </div>
    </div>
  );
}
