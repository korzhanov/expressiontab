import { describe, expect, it } from "bun:test";
import {
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

  it("resolvePicsum builds seeded URL", async () => {
    const p = await resolvePicsum("2026-09-21");
    expect(p.source).toBe("picsum");
    expect(p.imageUrl).toContain("picsum.photos/seed/2026-09-21/");
  });
});
