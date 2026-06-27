import { IconButton } from "../ui/ds";
import { PlusIcon, CloseIcon } from "../ui/icons";
import { PaneHeader } from "./PaneHeader";
import type { StoredAsset } from "../../hooks/useAssets";

interface AssetsPaneProps {
  assets: StoredAsset[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onClose?: () => void;
}

export function AssetsPane({ assets, onAdd, onRemove, onClose }: AssetsPaneProps) {
  return (
    <div className="flex flex-col">
      <PaneHeader title="Assets" onClose={onClose} />
      <div className="flex flex-col gap-3 px-4 py-5">
      <div className="eyebrow">Attached assets</div>

      {assets.length === 0 ? (
        <div className="text-sm text-text-faint">
          No assets attached. Add logos, screenshots, or mockups to embed into the poster.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="relative overflow-hidden"
              style={{
                borderRadius: "var(--radius-sm)",
                boxShadow: "inset 0 0 0 1px var(--border-subtle)",
              }}
            >
              <img
                src={a.dataUrl}
                alt={a.name || "Asset"}
                className="h-16 w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1 text-xs text-text-muted" style={{ background: "rgba(7,6,12,0.7)" }}>
                <span className="truncate">{a.name || "Asset"}</span>
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Remove"
                  onClick={() => onRemove(a.id)}
                >
                  <CloseIcon size={12} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2">
        <IconButton variant="ghost" size="md" label="Add asset" onClick={onAdd}>
          <PlusIcon size={16} />
        </IconButton>
      </div>
    </div>
    </div>
  );
}