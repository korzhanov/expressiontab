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

  it("lined link reserves menu padding only when open", () => {
    expect(src).toContain("class:hasMenu={multiButton && titleVisible}");
    expect(src).toContain("a.hasMenu");
  });
});
