import { Select, Input } from "../ui/ds";
import { PaneHeader } from "./PaneHeader";
import { ASPECT_RATIOS, type AspectRatioKey } from "../../utils/constants";

interface PropertiesPaneProps {
  count: number;
  onCountChange: (n: number) => void;
  aspectRatio: AspectRatioKey;
  onAspectChange: (r: AspectRatioKey) => void;
  /** null = no focused design (controls disabled). */
  bg: { hex: string; opacity: number; isLayer?: boolean } | null;
  onBgChange: (hex: string, opacity: number) => void;
  onClose?: () => void;
}

const countOptions = [1, 2, 3, 4].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? "variant" : "variants"}`,
}));

const aspectOptions = (Object.entries(ASPECT_RATIOS) as [
  AspectRatioKey,
  (typeof ASPECT_RATIOS)[AspectRatioKey],
][]).map(([key, v]) => ({
  value: key,
  label: `${key} (${v.width} × ${v.height})`,
}));

export function PropertiesPane({
  count,
  onCountChange,
  aspectRatio,
  onAspectChange,
  bg,
  onBgChange,
  onClose,
}: PropertiesPaneProps) {
  const disabled = bg === null;
  const hex = bg?.hex ?? "FFFFFF";
  const opacity = bg?.opacity ?? 100;

  return (
    <div className="flex flex-col">
      <PaneHeader title="Properties" onClose={onClose} />
      <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <div className="eyebrow mb-2">Batch</div>
        <Select
          options={countOptions}
          value={String(count)}
          onChange={(e) => onCountChange(Number(e.target.value))}
        />
      </div>

      <div>
        <div className="eyebrow mb-2">Resolution</div>
        <Select
          options={aspectOptions}
          value={aspectRatio}
          onChange={(e) => onAspectChange(e.target.value as AspectRatioKey)}
        />
      </div>

      <div>
        <div className="eyebrow mb-2">Background Color</div>
        <div className="flex items-center gap-2">
          <label
            className="relative shrink-0 cursor-pointer overflow-hidden"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-sm)",
              boxShadow: "inset 0 0 0 1px var(--border-default)",
              background: `#${hex}`,
              opacity: disabled ? 0.4 : 1,
            }}
            title="Pick color"
          >
            <input
              type="color"
              value={`#${hex}`}
              disabled={disabled}
              onChange={(e) => onBgChange(e.target.value.slice(1).toUpperCase(), opacity)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
          <div className="w-24">
            <Input
              value={hex}
              disabled={disabled}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
                onBgChange(v || "FFFFFF", opacity);
              }}
              className="font-mono"
              aria-label="Hex color"
            />
          </div>
          {/* Opacity only applies to the poster body background (no layer).
              When a background layer is applied the layer color is solid, so
              the opacity field is hidden — the layer's opacity lives in the
              Backgrounds pane. */}
          {!bg?.isLayer && (
            <div className="w-20">
              <Input
                value={`${opacity}%`}
                disabled={disabled}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, Number(e.target.value.replace(/[^0-9]/g, "")) || 0));
                  onBgChange(hex, v);
                }}
                aria-label="Opacity"
              />
            </div>
          )}
        </div>
        {disabled && (
          <div className="mt-2 text-xs text-text-faint">
            Focus a design to edit its background.
          </div>
        )}
      </div>
    </div>
    </div>
  );
}