import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("tooltip ui module", () => {
  it("exports Root/Tooltip from index", () => {
    // Проверяем публичный API модуля (без монтирования Svelte в bun:test)
    const index = readFileSync(
      join(import.meta.dir, "index.ts"),
      "utf8"
    );
    expect(index).toContain('from "./Tooltip.svelte"');
    expect(index).toContain("Tooltip");
  });

  it("Tooltip.svelte uses role=tooltip and delayDuration", () => {
    const src = readFileSync(
      join(import.meta.dir, "Tooltip.svelte"),
      "utf8"
    );
    expect(src).toContain('role="tooltip"');
    expect(src).toContain("delayDuration");
    expect(src).toContain("disabled");
    expect(src).toContain("use:tooltipPortal");
    expect(src).toContain("position: fixed");
    expect(src).toContain("claimActiveTooltip");
  });
});
