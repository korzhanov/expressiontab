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
    expect(ens).toContain("skipCover");
    const item = readFileSync(
      join(import.meta.dir, "AnchoreItem.svelte"),
      "utf8"
    );
    expect(item).toContain("skipCover: titleVisible");
  });

  it("Anchores debounces chunk rebuild for VirtualScroll stability", () => {
    const src = readFileSync(join(import.meta.dir, "Anchores.svelte"), "utf8");
    expect(src).toContain("lastChunksKey");
    expect(src).toContain("syncChunksIfNeeded");
    // Не зависеть от clientWidth anchores (прыжок при скролле)
    expect(src).toContain("НЕ зависеть от ww/hh");
    // rebuildChunks без loader=true
    const fn = src.slice(src.indexOf("async function rebuildChunks"));
    const body = fn.slice(0, fn.indexOf("function syncChunksIfNeeded"));
    expect(body).not.toContain("loader = true");
  });

  it("view toggle uses button and DialViewMode (no hidden checkbox)", () => {
    const src = readFileSync(join(import.meta.dir, "Anchores.svelte"), "utf8");
    expect(src).toContain("function toggleViewMode");
    expect(src).toContain("nextDialViewMode");
    expect(src).toContain("on:click|stopPropagation={toggleViewMode}");
    expect(src).not.toContain("window.scrollTo");
    expect(src).not.toContain('bind:checked={titleVisible}');
    expect(src).toContain('id="changeView"');
    expect(src).toContain('data-view-mode={viewMode}');
  });
});
