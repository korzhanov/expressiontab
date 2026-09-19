import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("tooltip ui module", () => {
  it("exports Root/Tooltip/Bubble/List from index", () => {
    // Проверяем публичный API модуля (без монтирования Svelte в bun:test)
    const index = readFileSync(
      join(import.meta.dir, "index.ts"),
      "utf8"
    );
    expect(index).toContain('from "./Tooltip.svelte"');
    expect(index).toContain('from "./BubbleTooltip.svelte"');
    expect(index).toContain('from "./ListTooltip.svelte"');
    expect(index).toContain("Tooltip");
    expect(index).toContain("Bubble");
    expect(index).toContain("List");
  });

  it("Tooltip.svelte uses role=tooltip and closeOnScroll policy", () => {
    const src = readFileSync(
      join(import.meta.dir, "Tooltip.svelte"),
      "utf8"
    );
    expect(src).toContain('role="tooltip"');
    expect(src).toContain("delayDuration");
    expect(src).toContain("disabled");
    expect(src).toContain("closeOnScroll");
    expect(src).toContain("use:tooltipPortal");
    expect(src).toContain("position: fixed");
    expect(src).toContain("claimActiveTooltip");
    // List: forceClose на scroll; Bubble: syncPos
    expect(src).toContain("forceClose");
    expect(src).toContain("onScrollOrResize");
    expect(src).toContain('addEventListener("scroll"');
  });

  it("BubbleTooltip keeps tip on scroll; ListTooltip closes", () => {
    const bubble = readFileSync(
      join(import.meta.dir, "BubbleTooltip.svelte"),
      "utf8"
    );
    const list = readFileSync(
      join(import.meta.dir, "ListTooltip.svelte"),
      "utf8"
    );
    expect(bubble).toContain("closeOnScroll={false}");
    expect(list).toContain("closeOnScroll={true}");
  });
});
