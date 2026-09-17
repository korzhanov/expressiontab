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
});
