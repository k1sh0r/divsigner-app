import { describe, expect, it } from "vitest";
import { stripMarkdownFence } from "./import";

describe("stripMarkdownFence", () => {
  it("removes a ```markdown wrapper", () => {
    expect(stripMarkdownFence("```markdown\n# A\nbody\n```")).toBe("# A\nbody");
  });
  it("removes a bare ``` wrapper", () => {
    expect(stripMarkdownFence("```\n# A\n```")).toBe("# A");
  });
  it("leaves unfenced content untouched", () => {
    expect(stripMarkdownFence("# A\nbody")).toBe("# A\nbody");
  });
});
