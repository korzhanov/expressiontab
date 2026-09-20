import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { scheduleIdle } from "./idle-schedule";

describe("idle-schedule", () => {
  it("scheduleIdle eventually runs task", async () => {
    let ran = false;
    scheduleIdle(() => {
      ran = true;
    }, { timeoutMs: 50 });
    await new Promise((r) => setTimeout(r, 120));
    expect(ran).toBe(true);
  });
});

describe("lazy icon load wiring", () => {
  it("Anchores does not blast enqueue on getBookmarks", () => {
    const src = readFileSync(join(import.meta.dir, "Anchores.svelte"), "utf8");
    expect(src).toContain("configureIconLoader");
    expect(src).toContain("resetIconEnsure");
    // Нет массового цикла enqueue при сборке dial
    expect(src).not.toContain("enqueueFavicon(node.url");
    expect(src).not.toContain("enqueueCover(node.url");
    expect(src).toContain("ensureIconsForAnchor у видимых");
  });

  it("BubbleDot and AnchoreItem call ensureIconsForAnchor", () => {
    const dot = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    const item = readFileSync(
      join(import.meta.dir, "AnchoreItem.svelte"),
      "utf8"
    );
    expect(dot).toContain("ensureIconsForAnchor");
    expect(item).toContain("ensureIconsForAnchor");
  });

  it("favicon/cover pumps use scheduleIdle and concurrency 1", () => {
    const bm = readFileSync(join(import.meta.dir, "bookmarks.ts"), "utf8");
    const cov = readFileSync(join(import.meta.dir, "cover-icons.ts"), "utf8");
    const ens = readFileSync(join(import.meta.dir, "icon-ensure.ts"), "utf8");
    expect(bm).toContain("scheduleIdle");
    expect(bm).toContain("FAVICON_CONCURRENCY = 1");
    expect(cov).toContain("scheduleIdle");
    expect(cov).toContain("CONCURRENCY = 1");
    expect(ens).toContain("ensureIconsForAnchor");
  });
});
