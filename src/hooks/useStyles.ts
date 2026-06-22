import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Style } from "../styles/types";

const STORAGE_KEY = "divsigner-styles";
export const MAX_CUSTOM_STYLES = 30;
const MAX_DESIGN_MD = 20_000; // chars

function makeId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Pure: build a custom Style (id, source, capped design.md). Exported for tests. */
export function makeCustomStyle(input: Omit<Style, "id" | "source">): Style {
  return {
    ...input,
    designMd: (input.designMd ?? "").slice(0, MAX_DESIGN_MD),
    id: makeId(),
    source: "custom",
  };
}

/** Pure: prepend a built style, capped FIFO. Exported for tests. */
export function addCustomStyle(list: Style[], style: Style): Style[] {
  return [style, ...list].slice(0, MAX_CUSTOM_STYLES);
}

/** Pure: merge a patch onto a custom style by id (re-caps design.md). */
export function updateCustomStyle(
  list: Style[],
  id: string,
  patch: Partial<Omit<Style, "id" | "source">>,
): Style[] {
  return list.map((s) =>
    s.id === id
      ? {
          ...s,
          ...patch,
          ...(patch.designMd !== undefined
            ? { designMd: patch.designMd.slice(0, MAX_DESIGN_MD) }
            : {}),
        }
      : s,
  );
}

export function useStyles() {
  const [customStyles, setCustomStyles] = useLocalStorage<Style[]>(STORAGE_KEY, []);

  const addStyle = useCallback(
    (input: Omit<Style, "id" | "source">): Style => {
      const created = makeCustomStyle(input);
      setCustomStyles((prev) => addCustomStyle(prev, created));
      return created;
    },
    [setCustomStyles],
  );

  const updateStyle = useCallback(
    (id: string, patch: Partial<Omit<Style, "id" | "source">>) =>
      setCustomStyles((prev) => updateCustomStyle(prev, id, patch)),
    [setCustomStyles],
  );

  const removeStyle = useCallback(
    (id: string) => setCustomStyles((prev) => prev.filter((s) => s.id !== id)),
    [setCustomStyles],
  );

  return { customStyles, addStyle, updateStyle, removeStyle };
}