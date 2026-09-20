import { describe, expect, it } from "bun:test";
import {
  isLinedView,
  nextDialViewMode,
  type DialViewMode,
} from "./dial-view-mode";

describe("dial-view-mode", () => {
  it("цикл bubble → lined → bubble", () => {
    expect(nextDialViewMode("bubble")).toBe("lined");
    expect(nextDialViewMode("lined")).toBe("bubble");
  });

  it("неизвестный current → сброс на bubble (cycle[0])", () => {
    // indexOf неизвестного = -1 → idx 0 → bubble
    expect(nextDialViewMode("grid" as DialViewMode)).toBe("bubble");
  });

  it("isLinedView только для lined", () => {
    expect(isLinedView("lined")).toBe(true);
    expect(isLinedView("bubble")).toBe(false);
  });
});
