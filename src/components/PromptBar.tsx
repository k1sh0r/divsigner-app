import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Dropdown, type DropdownItem } from "./ui/Dropdown";
import { Button } from "./ui/ds";
import {
  CloseIcon,
  CompareIcon,
  PlusIcon,
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
  /** Compare strip — shown when the focused job has >1 variant. */
  showCompare?: boolean;
  compareActive?: boolean;
  onToggleCompare?: () => void;
  /** Model dropdown (switches config.model). */
  model: string;
  onModelChange: (m: string) => void;
  modelOptions: string[];
  modelLoading: boolean;
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

function RefChip({
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
    <div
      className="inline-flex items-center gap-2 p-1.5 pr-2 transition-all duration-150 hover:-translate-y-[1px]"
      style={{
        borderRadius: "var(--radius-sm)",
        background: "var(--glass-2)",
        boxShadow: "var(--emboss-neutral)",
      }}
    >
      <img
        src={url}
        alt={label}
        className="object-cover"
        style={{ width: 36, height: 36, borderRadius: "var(--radius-xs)" }}
      />
      <div className="leading-tight">
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: tone === "asset" ? "var(--accent-soft)" : "var(--text-faint)" }}
        >
          {tone === "asset" ? "Asset" : "Reference"}
        </div>
        <div className="max-w-[120px] truncate text-xs text-text-muted">
          {label}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 flex h-5 w-5 items-center justify-center text-text-faint transition-all duration-150 hover:text-text btn-tactile"
        style={{ borderRadius: "var(--radius-xs)" }}
        aria-label="Remove"
      >
        <CloseIcon size={13} />
      </button>
    </div>
  );
}

/** A chip label (span, not a button) for use inside Dropdown labels. */
function ChipLabel({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[12px] font-medium tracking-[var(--tracking-mono)]">
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </span>
  );
}

/** A chip that opens a control (dropdown or pane). Mono, DS chip styling. */
function ChipButton({
  label,
  value,
  onClick,
  title,
}: {
  label: string;
  value: ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 h-7 px-3 font-mono text-[12px] font-medium tracking-[var(--tracking-mono)] transition-all duration-150 btn-tactile"
      style={{
        borderRadius: "var(--radius-sm)",
        background: "var(--glass-2)",
        boxShadow: "var(--emboss-neutral)",
        color: "var(--text-secondary)",
      }}
    >
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </button>
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
  showCompare = false,
  compareActive = false,
  onToggleCompare,
  model,
  onModelChange,
  modelOptions,
  modelLoading,
  onEnhancePrompt,
  enhancing,
  canEnhance,
  primaryAction,
  onPrimaryAction,
  mode,
}: PromptBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (
        (primaryAction.kind === "generate" ||
          primaryAction.kind === "iterate") &&
        !primaryAction.disabled
      ) {
        onPrimaryAction();
      }
    }
  };

  return (
    <div
      className="px-5 pt-4 pb-4"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--glass-1)",
        backdropFilter: "var(--blur-md)",
        WebkitBackdropFilter: "var(--blur-md)",
      }}
    >
      {/* Compare strip */}
      {showCompare && onToggleCompare && (
        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={onToggleCompare}
            className={`flex items-center gap-2 h-8 px-3 font-mono text-[13px] font-medium tracking-[var(--tracking-mono)] transition-all duration-150 btn-tactile ${
              compareActive ? "text-text-primary" : "text-text-muted hover:text-text-primary"
            }`}
            style={
              compareActive
                ? { background: "var(--accent-soft-rgba)", boxShadow: "inset 0 0 0 1px var(--border-accent)", borderRadius: "var(--radius-sm)" }
                : { background: "var(--glass-2)", boxShadow: "var(--emboss-neutral)", borderRadius: "var(--radius-sm)" }
            }
          >
            <CompareIcon size={14} />
            Compare variants
          </button>
        </div>
      )}

      {/* Attached reference / asset thumbnails */}
      {(references.length > 0 || assets.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {references.map((url, i) => (
            <RefChip
              key={`ref-${i}`}
              url={url}
              label="Reference"
              tone="ref"
              onRemove={() => onRemoveReference(i)}
            />
          ))}
          {assets.map((a) => (
            <RefChip
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        {/* + attach menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center h-7 w-7 transition-all duration-150 btn-tactile"
            style={{
              borderRadius: "var(--radius-sm)",
              background: "var(--glass-2)",
              boxShadow: "var(--emboss-neutral)",
              color: "var(--text-secondary)",
            }}
            title="Attach reference or asset"
            aria-label="Attach"
          >
            <PlusIcon size={15} />
          </button>
          {menuOpen && (
            <div
              className="menu-enter absolute bottom-full mb-2 left-0 z-30 w-64 p-1"
              style={{
                borderRadius: "var(--radius-md)",
                background: "var(--glass-3)",
                backdropFilter: "var(--blur-lg)",
                WebkitBackdropFilter: "var(--blur-lg)",
                boxShadow: "var(--glass-edge), var(--shadow-lg)",
              }}
            >
              <button
                type="button"
                onClick={() => pickFile("reference")}
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-all duration-150"
                style={{ borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft-rgba)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="text-sm font-medium text-text">Vision reference</span>
                <span className="text-xs text-text-muted">Guides the design — not placed in the poster</span>
              </button>
              <button
                type="button"
                onClick={() => pickFile("asset")}
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-all duration-150"
                style={{ borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft-rgba)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="text-sm font-medium text-text">Asset (use as-is)</span>
                <span className="text-xs text-text-muted">Logo, screenshot, mockup — embedded into the poster</span>
              </button>
            </div>
          )}
        </div>

        {/* Chips: ratio · batch · style · background */}
        <Dropdown
          label={<ChipLabel label="Ratio" value={aspectRatio} />}
          items={aspectItems}
          value={aspectRatio}
          onSelect={(v) => onAspectChange(v as AspectRatioKey)}
          width={200}
        />
        <Dropdown
          label={<ChipLabel label="Batch" value={count} />}
          items={countItems}
          value={String(count)}
          onSelect={(v) => onCountChange(Number(v))}
          width={140}
        />
        <ChipButton label="Style" value={selectedStyle.name} onClick={onBrowseStyles} />
        {onBrowseBackgrounds && (
          <ChipButton
            label="BG"
            value={selectedBackground?.name ?? "None"}
            onClick={onBrowseBackgrounds}
          />
        )}

        {/* Bottom-right cluster: Enhance · Model · Generate */}
        <div className="ml-auto flex items-center gap-2">
          {onEnhancePrompt && (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<WandIcon size={14} />}
              onClick={onEnhancePrompt}
              disabled={!canEnhance || enhancing}
              title="Enhance prompt with marketing copywriting"
            >
              {enhancing ? "Enhancing…" : "Enhance"}
            </Button>
          )}

          {/* Model dropdown — switches config.model. Manual entry fallback
              for providers with no /models endpoint. */}
          {modelOptions.length > 0 ? (
            <Dropdown
              label={
                <span className="font-mono text-[12px] tracking-[var(--tracking-mono)] text-text-secondary">
                  {modelLoading ? "Loading…" : model}
                </span>
              }
              items={modelOptions.map((m) => ({ value: m, label: m }))}
              value={model}
              onSelect={(v) => onModelChange(v)}
              width={220}
            />
          ) : (
            <input
              type="text"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder="model-name"
              className="font-mono text-[12px] tracking-[var(--tracking-mono)] text-text-secondary h-7 px-3 focus:outline-none"
              style={{
                width: 180,
                borderRadius: "var(--radius-sm)",
                background: "rgba(7,6,12,0.6)",
                boxShadow: "inset 0 0 0 1px var(--border-default)",
                color: "var(--text-primary)",
              }}
              title="Model"
            />
          )}

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
      <Button variant="danger" size="sm" iconLeft={<StopDot />} onClick={onClick}>
        Stop
      </Button>
    );
  }
  if (action.kind === "retry") {
    return (
      <Button
        variant="primary"
        size="sm"
        iconLeft={<SparkleIcon size={15} />}
        onClick={onClick}
        className=""
        style={{ background: "linear-gradient(180deg, #FFCB52 0%, #F5A623 100%)" }}
      >
        Retry
      </Button>
    );
  }
  // generate | iterate
  const disabled = action.disabled;
  return (
    <Button
      variant="primary"
      size="sm"
      iconRight={<SparkleIcon size={15} />}
      onClick={onClick}
      disabled={disabled}
    >
      {action.kind === "iterate" ? "Iterate" : "Generate"}
    </Button>
  );
}

function StopDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
      <span className="relative inline-flex h-2 w-2 rounded-sm bg-white" />
    </span>
  );
}