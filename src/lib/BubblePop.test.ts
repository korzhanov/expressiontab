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

  it("BubbleField spawns children before pop, then shrinks to linkR; fold pops kids", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleField.svelte"), "utf8");
    const fnAt = src.indexOf("function commitExpandPop");
    expect(fnAt).toBeGreaterThan(0);
    const body = src.slice(fnAt, fnAt + 1800);
    // Spawn раньше присвоения poppingId; LEAD_MS и shrink к linkR
    expect(body.indexOf("expandHost({")).toBeGreaterThan(0);
    expect(body.indexOf("expandHost({")).toBeLessThan(body.indexOf("poppingId = b.id"));
    expect(body).toContain("GROUP_SPAWN_LEAD_MS");
    expect(body).toContain("startShrinkToWeight");
    expect(body).toContain("b.linkR");
    expect(src).toContain("commitCollapseAbsorb");
    expect(src).toContain("GROUP_ABSORB_MS");
    expect(src).toContain("poppingChildIds");
    expect(src).toContain("clusterRadiusFromChildRadii");
    expect(src).toContain("startCraterFill");
    expect(src).toContain("beginDragCollisions");
    expect(src).toContain("endDragCollisions");
    // При drag ResizeObserver не раздувает мир
    expect(src).toContain("if (!world || dragBubble) return");
    expect(src).toContain("groupR ?? n.baseR");
  });
});
