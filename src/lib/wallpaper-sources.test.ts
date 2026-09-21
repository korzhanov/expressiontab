import { describe, expect, it } from "bun:test";
import {
  formatWallpaperCredit,
  pickSourceForDay,
  resolvePicsum,
  wallpaperDayKey,
} from "./wallpaper-sources";

describe("wallpaper-sources", () => {

  it("wallpaperDayKey is YYYY-MM-DD", () => {
    expect(wallpaperDayKey(new Date("2026-09-21T12:00:00Z"))).toBe(
      "2026-09-21"
    );
  });

  it("pickSourceForDay is stable and rotates across year", () => {
    const a = pickSourceForDay("2026-09-21");
    const b = pickSourceForDay("2026-09-21");
    expect(a).toBe(b);
    const set = new Set<string>();
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        const key = `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        set.add(pickSourceForDay(key));
      }
    }
    // За год должны встретиться все 5 источников
    expect(set.size).toBe(5);
    expect(set.has(undefined as unknown as string)).toBe(false);
  });

  it("formatWallpaperCredit prefers copyright over title", () => {
    expect(
      formatWallpaperCredit({
        copyright: "© Photographer",
        title: "Title only",
        source: "bing-archive",
      })
    ).toBe("© Photographer");
    expect(
      formatWallpaperCredit({
        title: "Title only",
        source: "peapix-bing",
      })
    ).toBe("Title only");
    // User drop — пустая подпись
    expect(formatWallpaperCredit({ title: "x", source: "user" })).toBe("");
    expect(formatWallpaperCredit({})).toBe("");
  });

  it("resolvePicsum builds seeded URL and credit from /info", async () => {
    // Мок /info — без сети в unit-тесте
    const orig = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          author: "Jane Doe",
          url: "https://unsplash.com/@jane",
          id: 1,
        }),
        { status: 200 }
      )) as typeof fetch;
    try {
      const p = await resolvePicsum("2026-09-21");
      expect(p.source).toBe("picsum");
      expect(p.imageUrl).toContain("picsum.photos/seed/2026-09-21/");
      expect(p.copyright).toContain("Jane Doe");
      expect(p.creditUrl).toBe("https://unsplash.com/@jane");
    } finally {
      globalThis.fetch = orig;
    }
  });

  it("resolvePicsum falls back when /info fails", async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("offline");
    }) as typeof fetch;
    try {
      const p = await resolvePicsum("2026-09-22");
      expect(p.copyright).toBe("Photo via Lorem Picsum");
      expect(p.creditUrl).toBe("https://picsum.photos");
    } finally {
      globalThis.fetch = orig;
    }
  });
});
