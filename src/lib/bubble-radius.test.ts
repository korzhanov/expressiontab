import { describe, expect, it } from "bun:test";
import {
  BUBBLE_R_MAX,
  BUBBLE_R_MIN,
  bubbleDiameter,
  bubbleRadiusFromVisits,
} from "./bubble-radius";

describe("bubbleRadiusFromVisits", () => {
  it("clamps low visits near min", () => {
    expect(bubbleRadiusFromVisits({ visitCount: 1 })).toBe(BUBBLE_R_MIN);
  });

  it("grows with more visits but stays within max", () => {
    const a = bubbleRadiusFromVisits({ visitCount: 10 });
    const b = bubbleRadiusFromVisits({ visitCount: 200 });
    const c = bubbleRadiusFromVisits({ visitCount: 10000 });
    expect(a).toBeGreaterThan(BUBBLE_R_MIN);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeLessThanOrEqual(BUBBLE_R_MAX);
  });

  it("bubbleDiameter is 2r", () => {
    expect(bubbleDiameter(40)).toBe(80);
  });
});
