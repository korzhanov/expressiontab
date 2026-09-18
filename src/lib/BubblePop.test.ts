import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("BubblePop", () => {
  it("credits CodePen source and defines pop keyframes", () => {
    const src = readFileSync(join(import.meta.dir, "BubblePop.svelte"), "utf8");
    expect(src).toContain("codepen.io/jkantner/pen/poYZMXX");
    expect(src).toContain("bubblePopBall");
    expect(src).toContain("bubblePopDrop");
  });

  it("BubbleDot wires inflate/pop before group expand", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    expect(src).toContain("BubblePop");
    expect(src).toContain("onInflateStart");
    expect(src).toContain("onExpandCommit");
    expect(src).toContain("popping");
  });
});
