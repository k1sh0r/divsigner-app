import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Dropdown, type DropdownItem } from "./ui/Dropdown";
import {
  CloseIcon,
  ImportIcon,
  PlusIcon,
  SettingsIcon,
  SparkleIcon,
  WandIcon,
} from "./ui/icons";
import type { Style } from "../styles/types";
import type { StoredAsset } from "../hooks/useAssets";
import { ASPECT_RATIOS, type AspectRatioKey } from "../utils/constants";

interface PromptBarProps {
  value: string;
  onChange: (v: string) => void;
  selectedStyle: Style;
  onBrowseStyles: () => void;
  selectedBackground?: { id: string; name: string } | null;
  onBrowseBackgrounds?: () => void;
  aspectRatio: AspectRatioKey;
  onAspectChange: (r: AspectRatioKey) => void;
  count: number;
  onCountChange: (n: number) => void;
  references: string[];
  assets: StoredAsset[];
  onAttachReference: (dataUrl: string) => void;
  onAttachAsset: (dataUrl: string, name: string) => void;
  onRemoveReference: (index: number) => void;
  onRemoveAsset: (id: string) => void;
  onImportHtml: (html: string) => void;
  onToggleSettings: () => void;
  onEnhancePrompt?: () => Promise<void>;
  enhancing?: boolean;
  canEnhance?: boolean;
  /** What the primary (right-most) button does, driven by the focused slide. */
  primaryAction: PrimaryAction;
  onPrimaryAction: () => void;
  /** Placeholder mode for the textarea. */
  mode: "iterate" | "new";
}

/** The contextual state of the primary generate/stop/retry/iterate button.
 *  Computed by App from whichever slide the user is focused on. */
export type PrimaryAction =
  | { kind: "generate"; disabled: boolean }
  | { kind: "iterate"; disabled: boolean }
  | { kind: "stop" }
  | { kind: "retry" };

const aspectItems: DropdownItem[] = (
  Object.entries(ASPECT_RATIOS) as [
    AspectRatioKey,
    (typeof ASPECT_RATIOS)[AspectRatioKey],
  ][]
).map(([key, v]) => ({ value: key, label: v.label, hint: `${v.width}×${v.height}` }));

const countItems: DropdownItem[] = [1, 2, 3, 4].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? "variant" : "variants"}`,
}));

function Chip({
  url,
  label,
  tone,
  onRemove,
}: {
  url: string;
  label: string;
  tone: "ref" | "asset";
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface p-1.5 pr-2 transition-all duration-150 hover:border-border-strong hover:shadow-sm hover:-translate-y-[1px]">
      <img src={url} alt={label} className="h-9 w-9 rounded-sm object-cover" />
      <div className="leading-tight">
        <div
          className={`text-[10px] font-bold uppercase tracking-wider ${
            tone === "asset" ? "text-accent-soft" : "text-text-faint"
          }`}
        >
          {tone === "asset" ? "Asset" : "Reference"}
        </div>
        <div className="max-w-[120px] truncate text-xs text-text-muted">
          {label}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-sm text-text-faint transition-all duration-150 hover:bg-surface-2 hover:text-text btn-tactile"
        aria-label="Remove"
      >
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

export function PromptBar({
  value,
  onChange,
  selectedStyle,
  onBrowseStyles,
  selectedBackground,
  onBrowseBackgrounds,
  aspectRatio,
  onAspectChange,
  count,
  onCountChange,
  references,
  assets,
  onAttachReference,
  onAttachAsset,
  onRemoveReference,
  onRemoveAsset,
  onImportHtml,
  onToggleSettings,
  onEnhancePrompt,
  enhancing,
  canEnhance,
  primaryAction,
  onPrimaryAction,
  mode,
}: PromptBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLInputElement>(null);
  const attachKind = useRef<"reference" | "asset">("reference");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const pickFile = (kind: "reference" | "asset") => {
    attachKind.current = kind;
    setMenuOpen(false);
    fileRef.current?.click();
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      if (attachKind.current === "asset") onAttachAsset(url, file.name);
      else onAttachReference(url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleHtmlFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onImportHtml(reader.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Enter triggers the primary action only when it's a generation
      // (not Stop/Retry, which have their own focused targets).
      if (
        (primaryAction.kind === "generate" ||
          primaryAction.kind === "iterate") &&
        !primaryAction.disabled
      ) {
        onPrimaryAction();
      }
    }
  };

  // Shared secondary-button treatment for the control row.
  const ghostBtn =
    "flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-sm font-medium text-text-muted hover:border-border-strong hover:text-text hover:bg-surface-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile";

  return (
    <div className="border-t border-border bg-surface-2 px-5 pt-4 pb-4">
      {(references.length > 0 || assets.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {references.map((url, i) => (
            <Chip
              key={`ref-${i}`}
              url={url}
              label="Reference"
              tone="ref"
              onRemove={() => onRemoveReference(i)}
            />
          ))}
          {assets.map((a) => (
            <Chip
              key={a.id}
              url={a.dataUrl}
              label={a.name || "Asset"}
              tone="asset"
              onRemove={() => onRemoveAsset(a.id)}
            />
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder={
          mode === "iterate"
            ? "Describe a change to the current design…"
            : "Enter your prompt"
        }
        className="w-full resize-none bg-transparent text-[15px] text-text placeholder:text-text-faint focus:outline-none leading-relaxed"
      />

      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((o) => !o)} className={ghostBtn}>
            Attach
            <PlusIcon size={14} />
          </button>
          {menuOpen && (
            <div
              style={{ boxShadow: "var(--shadow-menu)" }}
              className="menu-enter absolute bottom-full mb-2 left-0 z-30 w-64 rounded-md border border-border bg-surface-2 p-1"
            >
              <button
                type="button"
                onClick={() => pickFile("reference")}
                className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left transition-all duration-150 hover:bg-surface-3"
              >
                <span className="text-sm font-medium text-text">
                  Vision reference
                </span>
                <span className="text-xs text-text-muted">
                  Guides the design — not placed in the poster
                </span>
              </button>
              <button
                type="button"
                onClick={() => pickFile("asset")}
                className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left transition-all duration-150 hover:bg-surface-3"
              >
                <span className="text-sm font-medium text-text">
                  Asset (use as-is)
                </span>
                <span className="text-xs text-text-muted">
                  Logo, screenshot, mockup — embedded into the poster
                </span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={htmlRef}
          type="file"
          accept=".html,.htm,text/html"
          onChange={handleHtmlFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => htmlRef.current?.click()}
          title="Import an existing HTML poster"
          className={ghostBtn}
        >
          Import
          <ImportIcon size={14} />
        </button>

        <button
          type="button"
          onClick={onBrowseStyles}
          className={ghostBtn}
        >
          <span className="text-text-faint">Style</span> {selectedStyle.name}
        </button>

        {onBrowseBackgrounds && (
          <button
            type="button"
            onClick={onBrowseBackgrounds}
            className={ghostBtn}
          >
            <span className="text-text-faint">Bg</span>{" "}
            {selectedBackground?.name ?? "None"}
          </button>
        )}

        <Dropdown
          label={<>Aspect Ratio</>}
          items={aspectItems}
          value={aspectRatio}
          onSelect={(v) => onAspectChange(v as AspectRatioKey)}
          width={200}
        />

        <Dropdown
          label={<span className="tabular-nums">{count}</span>}
          items={countItems}
          value={String(count)}
          onSelect={(v) => onCountChange(Number(v))}
          width={140}
        />

        <div className="ml-auto flex items-center gap-2">
          {onEnhancePrompt && (
            <button
              type="button"
              onClick={onEnhancePrompt}
              disabled={!canEnhance || enhancing}
              title="Enhance prompt with marketing copywriting"
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface text-sm font-medium text-text-muted hover:border-accent hover:text-accent hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
            >
              {enhancing ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-sm bg-accent" />
                  </span>
                  Enhancing…
                </>
              ) : (
                <>
                  <WandIcon size={14} />
                  Enhance
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSettings}
            aria-label="Toggle settings"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:border-border-strong hover:text-text hover:bg-surface-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
          >
            <SettingsIcon size={18} />
          </button>

          <PrimaryButton action={primaryAction} onClick={onPrimaryAction} />
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({
  action,
  onClick,
}: {
  action: PrimaryAction;
  onClick: () => void;
}) {
  if (action.kind === "stop") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 h-9 px-4 rounded-md bg-danger hover:bg-danger/85 text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger btn-tactile"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex h-2 w-2 rounded-sm bg-white" />
        </span>
        Stop
      </button>
    );
  }

  if (action.kind === "retry") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 h-9 px-4 rounded-md bg-warning hover:brightness-110 text-sm font-bold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning btn-tactile"
      >
        <SparkleIcon size={15} />
        Retry
      </button>
    );
  }

  // generate | iterate
  const disabled = action.disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="accent-fill flex items-center gap-2 h-9 px-4 rounded-md text-sm font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)] enabled:hover:brightness-110 enabled:hover:shadow-[0_4px_16px_rgba(107,87,238,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent btn-tactile"
    >
      {action.kind === "iterate" ? "Iterate" : "Generate"}
      <SparkleIcon size={15} />
    </button>
  );
}
