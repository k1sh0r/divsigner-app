import { describe, expect, it } from "vitest";
import { makeCustomStyle, addCustomStyle, updateCustomStyle } from "./useStyles";
import type { Style } from "../styles/types";

const base = (over: Partial<Style> = {}): Style =>
  makeCustomStyle({ name: "A", description: "d", designMd: "x", ...over });

describe("updateCustomStyle", () => {
  it("merges a patch onto the matching id", () => {
    const s = base();
    const out = updateCustomStyle([s], s.id, { name: "B", website: "https://x.dev" });
    expect(out[0]!.name).toBe("B");
    expect(out[0]!.website).toBe("https://x.dev");
    expect(out[0]!.id).toBe(s.id);
    expect(out[0]!.source).toBe("custom");
  });
  it("is a no-op when the id is not found", () => {
    const s = base();
    expect(updateCustomStyle([s], "nope", { name: "B" })).toEqual([s]);
  });
  it("re-applies the design.md cap when designMd is patched", () => {
    const s = base();
    const out = updateCustomStyle([s], s.id, { designMd: "y".repeat(50_000) });
    expect(out[0]!.designMd!.length).toBe(20_000);
  });
  it("updates a style produced via addCustomStyle", () => {
    const s = base();
    const list = addCustomStyle([], s);
    const out = updateCustomStyle(list, s.id, { name: "C" });
    expect(out[0]!.name).toBe("C");
  });
});
