import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { AssetMap } from "../utils/assets";

export interface StoredAsset {
  id: string;
  name: string;
  dataUrl: string;
}

const STORAGE_KEY = "divsigner-assets";
const MAX_ASSETS = 24;

function makeId(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Persisted store of user-attached assets (logos, screenshots, mockups) that
 * get embedded as-is into posters. Kept separate from history so poster HTML
 * stays lean (it references `asset://<id>` tokens) and assets are shared/deduped.
 */
export function useAssets() {
  const [assets, setAssets] = useLocalStorage<StoredAsset[]>(STORAGE_KEY, []);

  const addAsset = useCallback(
    (name: string, dataUrl: string): StoredAsset => {
      const asset: StoredAsset = { id: makeId(), name, dataUrl };
      setAssets((prev) => [asset, ...prev].slice(0, MAX_ASSETS));
      return asset;
    },
    [setAssets],
  );

  const map = useMemo<AssetMap>(() => {
    const m: AssetMap = {};
    for (const a of assets) m[a.id] = a.dataUrl;
    return m;
  }, [assets]);

  return { assets, addAsset, map };
}
