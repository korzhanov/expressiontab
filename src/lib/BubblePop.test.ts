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

  it("bookmark uses white shine and gold star under favicon", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    // Нет жёлтого блика / hue на весь шар
    expect(src).not.toContain(".bubbleDot.bookmark .bubbleDot__shine");
    expect(src).not.toMatch(/\.bubbleDot\.bookmark\s*\{[^}]*--hue:\s*42/);
    // Золотая звезда под фавиконом закладок
    expect(src).toContain("bubbleDot__star");
    expect(src).toContain("starred={bubble.isBookmark}");
    expect(src).toContain("#f0c040");
  });

  it("BubbleField spawns children before pop, then shrinks to linkR; fold pops kids", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleField.svelte"), "utf8");
    const fnAt = src.indexOf("function commitExpandPop");
    expect(fnAt).toBeGreaterThan(0);
    const body = src.slice(fnAt, fnAt + 2800);
    // Spawn раньше присвоения poppingId; LEAD_MS и shrink к linkR
    expect(body.indexOf("expandHost({")).toBeGreaterThan(0);
    expect(body.indexOf("expandHost({")).toBeLessThan(body.indexOf("poppingId = b.id"));
    expect(body).toContain("GROUP_SPAWN_LEAD_MS");
    expect(body).toContain("startShrinkToWeight");
    expect(body).toContain("b.linkR");
    expect(body).toContain("skipSpawn");
    expect(src).toContain("commitCollapseAbsorb");
    expect(src).toContain("GROUP_ABSORB_MS");
    expect(src).toContain("poppingChildIds");
    // Hover на раскрытой: рост → leave откат
    expect(src).toContain("onExpandedHoverGrow");
    expect(src).toContain("expandedGrow");
    expect(src).toContain("GROUP_EXPANDED_HOVER_GROW_MS");
    expect(src).toContain("GROUP_EXPANDED_HOVER_SHRINK_MS");
    // Inflate/deflate не разгоняет всё поле
    expect(src).toContain("beginSoftRadiusAdjust");
    expect(src).toContain("nudgeSim");
    expect(src).not.toContain("reheat(world, 0.55)");
    expect(src).toContain("GROUP_MAX_CHILDREN");
    expect(src).not.toContain("slice(1, 25)");
    expect(src).not.toContain("maxChildren: 24");
    // Unfold: сжатие к linkR (не cluster inflate)
    expect(src).toContain("groupR → linkR");
    expect(src).not.toContain("clusterRadiusFromChildRadii");
    expect(src).toContain("startCraterFill");
    expect(src).toContain("beginDragCollisions");
    expect(src).toContain("endDragCollisions");
    // При drag тоже bounce от краёв (соседи не улетают за блок)
    expect(src).toContain("bounceBubblesAtWorldEdges(world.nodes, world.width, world.height)");
    const tickAt = src.indexOf("function onTick");
    expect(tickAt).toBeGreaterThan(0);
    const tickBody = src.slice(tickAt, tickAt + 900);
    expect(tickBody.indexOf("bounceBubblesAtWorldEdges")).toBeLessThan(
      tickBody.indexOf("if (dragMoved && dragBubble)")
    );
    // Hover: дети с 2с по очереди, на 3с flush
    expect(src).toContain("scheduleHoverChildSpawn");
    expect(src).toContain("flushPendingChildren");
    expect(src).toContain("GROUP_CHILD_SPAWN_AT_MS");
    expect(src).toContain("GROUP_CHILD_STAGGER_MS");
    expect(src).toContain("keepParentR: true");
    // При drag ResizeObserver не раздувает мир
    expect(src).toContain("if (!world || dragBubble) return");
    expect(src).toContain("groupR ?? n.baseR");
    // Fold: рост только до groupR
    const foldAt = src.indexOf("function commitCollapseAbsorb");
    expect(foldAt).toBeGreaterThan(0);
    const foldBody = src.slice(foldAt, foldAt + 1200);
    expect(foldBody).toContain("const r1 = groupR");
    expect(foldBody).not.toContain("clusterRadiusFromChildRadii");
  });
});
