import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  bubbleNavHue,
  shouldSkipNavTransition,
  viewportCoverRadius,
} from "./bubble-nav-transition";

describe("viewportCoverRadius", () => {
  it("covers farthest corner from center", () => {
    // Центр 100,100 в 200×200 → угол 0,0 на √(100²+100²)≈141.4
    const r = viewportCoverRadius(100, 100, 200, 200);
    expect(r).toBeGreaterThan(141);
    expect(r).toBeLessThan(150);
  });
});

describe("navBurstPortal layer", () => {
  it("uses a body layer above filterBar z-index", () => {
    const src = readFileSync(
      join(import.meta.dir, "bubble-nav-transition.ts"),
      "utf8"
    );
    expect(src).toContain('NAV_BURST_LAYER_ID = "expressiontab-nav-burst-layer"');
    expect(src).toContain('zIndex = "300000"');
    expect(src).toContain("navBurstPortal");
  });
});

describe("bubbleNavHue", () => {
  it("maps bookmark / session / child / default", () => {
    expect(bubbleNavHue({ isBookmark: true })).toBe(42);
    expect(bubbleNavHue({ isSession: true })).toBe(175);
    expect(bubbleNavHue({ kind: "child" })).toBe(165);
    expect(bubbleNavHue({ groupable: true })).toBe(280);
    expect(bubbleNavHue({})).toBe(200);
  });
});

describe("shouldSkipNavTransition", () => {
  it("skips reduced motion and bad urls", () => {
    expect(
      shouldSkipNavTransition({
        reducedMotion: true,
        url: "https://a.com",
      })
    ).toBe(true);
    expect(shouldSkipNavTransition({ url: "chrome://settings" })).toBe(true);
    expect(shouldSkipNavTransition({ url: "https://a.com" })).toBe(false);
  });
});
