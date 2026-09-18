import { describe, expect, it } from "bun:test";
import {
  formatHistoryRangeLabel,
  historySearchBounds,
  type HistoryRangeState,
} from "./history-range";

describe("history-range", () => {
  it("historySearchBounds respects presets", () => {
    const now = Date.now();
    const w1 = historySearchBounds({ preset: "1w", fromDate: "", toDate: "" });
    expect(now - w1.startTime).toBeGreaterThan(6 * 86400000);
    expect(w1.endTime).toBeLessThanOrEqual(now + 1);

    const all = historySearchBounds({ preset: "all", fromDate: "", toDate: "" });
    expect(all.startTime).toBe(0);
  });

  it("formatHistoryRangeLabel matches preset", () => {
    expect(formatHistoryRangeLabel({ preset: "4w", fromDate: "", toDate: "" })).toBe(
      "4 weeks"
    );
    const custom: HistoryRangeState = {
      preset: "custom",
      fromDate: "2024-01-01",
      toDate: "2024-02-01",
    };
    expect(formatHistoryRangeLabel(custom)).toContain("2024-01-01");
  });
});
