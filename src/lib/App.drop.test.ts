import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("App image drop wiring", () => {
  it("handles drag-drop and offers open or set background", () => {
    const src = readFileSync(join(import.meta.dir, "../newtab/App.svelte"), "utf8");
    expect(src).toContain("parseImageDrop");
    expect(src).toContain("fileToBackgroundDataUrl");
    expect(src).toContain("saveBackgroundUrl");
    expect(src).toContain("Open in new window");
    expect(src).toContain("Set as background");
    expect(src).toContain("on:drop={onDrop}");
    expect(src).not.toContain("persist(writable");
    // Drop → JPEG data + blob CSS; daily keyless wallpaper
    expect(src).toContain("remoteImageToJpegDataUrl");
    expect(src).toContain("applyBgDisplay");
    expect(src).toContain("fetchDailyWallpaperDataUrl");
    expect(src).toContain("userLocked: true");
    expect(src).toContain("toCssBackgroundUrl");
    // #100: копирайт обоев, если API отдал
    expect(src).toContain("formatWallpaperCredit");
    expect(src).toContain("bgCredit");
    expect(src).toContain("applyCredit");
  });
});
