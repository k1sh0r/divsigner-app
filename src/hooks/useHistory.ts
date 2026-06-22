import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { AspectRatioKey } from "../utils/constants";

export interface HistoryItem {
  html: string;
}

/** Drop base64 data URIs so localStorage only ever holds lean HTML. */
function stripBase64(html: string): string {
  return html.replace(/data:[^,\s)'"]+;base64,[A-Za-z0-9+/=]+/g, "");
}

export interface HistoryBatch {
  id: string;
  prompt: string;
  presetId: string;
  aspectRatio: AspectRatioKey;
  createdAt: number;
  /** One entry per variant generated in this batch. */
  items: HistoryItem[];
}

const STORAGE_KEY = "divsigner-history";
const MAX_BATCHES = 40;

function makeId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function useHistory() {
  const [batches, setBatches] = useLocalStorage<HistoryBatch[]>(STORAGE_KEY, []);

  const addBatch = useCallback(
    (batch: Omit<HistoryBatch, "id" | "createdAt">): string => {
      if (batch.items.length === 0) return "";
      const id = makeId();
      setBatches((prev) => {
        const next: HistoryBatch = {
          ...batch,
          items: batch.items.map((i) => ({ html: stripBase64(i.html) })),
          id,
          createdAt: Date.now(),
        };
        return [next, ...prev].slice(0, MAX_BATCHES);
      });
      return id;
    },
    [setBatches],
  );

  const removeBatch = useCallback(
    (id: string) => setBatches((prev) => prev.filter((b) => b.id !== id)),
    [setBatches],
  );

  const updateItem = useCallback(
    (batchId: string, index: number, html: string) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id !== batchId
            ? b
            : {
                ...b,
                items: b.items.map((it, i) =>
                  i === index ? { html: stripBase64(html) } : it,
                ),
              },
        ),
      );
    },
    [setBatches],
  );

  const clear = useCallback(() => setBatches([]), [setBatches]);

  return { batches, addBatch, removeBatch, updateItem, clear };
}
