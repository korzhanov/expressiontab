import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("HostItem lined group row", () => {
  const src = readFileSync(join(import.meta.dir, "HostItem.svelte"), "utf8");

  it("keeps host title and groupToggle on one lined row", () => {
    // flex-wrap: nowrap — кнопка «ещё N» не падает под заголовок
    expect(src).toContain("flex-wrap: nowrap");
    // заголовок уступает ширину кнопке (не width:100% через tooltip.block)
    expect(src).toContain("flex: 1 1 0%");
    expect(src).toMatch(/tooltip-root\.block[\s\S]*width: auto/);
    // кнопка не сжимается и стоит слева в том же ряду
    expect(src).toContain("flex: 0 0 auto");
    expect(src).toContain("order: -1");
  });

  it("renders groupToggle with count in lined view", () => {
    expect(src).toContain('class="groupToggle"');
    expect(src).toContain("groupToggleCount");
    expect(src).toContain("aria-expanded={unfold}");
  });
});
