import { describe, expect, it } from "vitest";
import { deriveSummary } from "./summary";

describe("deriveSummary", () => {
  it("returns the first non-heading paragraph", () => {
    const md = "# Acme\n\n## Colors\n\nBold, high-contrast brand with electric accents.";
    expect(deriveSummary(md)).toBe("Bold, high-contrast brand with electric accents.");
  });
  it("prefers the line after a Design Language heading (## or #)", () => {
    const md = "# Acme\n\nfiller line\n\n## Design Language\n\nCalm, editorial, generous whitespace.";
    expect(deriveSummary(md)).toBe("Calm, editorial, generous whitespace.");
  });
  it("caps at ~140 chars without cutting mid-word and adds an ellipsis", () => {
    const long = "word ".repeat(60).trim();
    const out = deriveSummary(`# X\n\n${long}`);
    expect(out.length).toBeLessThanOrEqual(141);
    expect(out.endsWith("…")).toBe(true);
  });
  it("returns empty string for empty / heading-only input", () => {
    expect(deriveSummary("")).toBe("");
    expect(deriveSummary("# Only A Heading\n## And Another")).toBe("");
  });
});
