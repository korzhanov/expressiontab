import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("AnchoreItem lined title + delete", () => {
  const src = readFileSync(join(import.meta.dir, "AnchoreItem.svelte"), "utf8");

  it("showTitle includes last visit when present", () => {
    expect(src).toContain("lastVisitLabel");
    expect(src).toContain("showTitleLine");
    expect(src).toContain("formatDateShort");
  });

  it("delete uses deleteDialUrl for bookmark + history", () => {
    expect(src).toContain("deleteDialUrl");
    expect(src).toContain("chromeApi: chrome");
  });

  it("delete clears url in nodesList so groupToggleCount updates", () => {
    expect(src).toContain("clearUrlsInNodesList");
    expect(src).toContain("nodesList.update");
  });

  it("lined reserves space and overlays action buttons", () => {
    expect(src).toContain("padding: 6px 6.75rem 6px 8px");
    expect(src).toContain(".multiButton.lined");
    expect(src).toContain("linear-gradient");
  });

  it("lined delete uses listRemoving slide, not BubblePop", () => {
    expect(src).toContain("listRemoving");
    expect(src).toContain("titleVisible.listRemoving");
    // BubblePop только вне lined
    expect(src).toMatch(/\{#if !titleVisible\}[\s\S]*BubblePop/);
  });
});
