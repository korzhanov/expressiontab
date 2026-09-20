import { describe, expect, it } from "bun:test";
import {
  datesForPreset,
  draftDatesFromRange,
  formatHistoryRangeLabel,
  historySearchBounds,
  shouldDismissRangePopover,
  toDateInputValue,
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

  it("today and yesterday bound to local calendar days", () => {
    const now = Date.now();
    const today = historySearchBounds({
      preset: "today",
      fromDate: "",
      toDate: "",
    });
    // Сегодня с 00:00
    expect(today.startTime).toBeLessThanOrEqual(now);
    expect(now - today.startTime).toBeLessThan(86400000);
    expect(today.endTime).toBeLessThanOrEqual(now + 1);

    const y = historySearchBounds({
      preset: "yesterday",
      fromDate: "",
      toDate: "",
    });
    expect(y.endTime).toBeLessThan(today.startTime);
    expect(y.endTime - y.startTime).toBeGreaterThan(86000000);
  });

  it("datesForPreset fills yyyy-mm-dd for date inputs", () => {
    const fixed = Date.parse("2024-06-15T15:00:00");
    const today = datesForPreset("today", fixed);
    expect(today.fromDate).toBe("2024-06-15");
    expect(today.toDate).toBe("2024-06-15");
    const yest = datesForPreset("yesterday", fixed);
    expect(yest.fromDate).toBe("2024-06-14");
    expect(yest.toDate).toBe("2024-06-14");
    const w4 = datesForPreset("4w", fixed);
    expect(w4.toDate).toBe("2024-06-15");
    expect(w4.fromDate).toBe(toDateInputValue(fixed - 28 * 86400000));
  });

  it("draftDatesFromRange prefers custom dates, else preset", () => {
    const custom: HistoryRangeState = {
      preset: "custom",
      fromDate: "2024-01-01",
      toDate: "2024-02-01",
    };
    expect(draftDatesFromRange(custom)).toEqual({
      fromDate: "2024-01-01",
      toDate: "2024-02-01",
    });
    const draft = draftDatesFromRange(
      { preset: "today", fromDate: "", toDate: "" },
      Date.parse("2024-06-15T12:00:00")
    );
    expect(draft.fromDate).toBe("2024-06-15");
  });

  it("formatHistoryRangeLabel matches preset", () => {
    expect(formatHistoryRangeLabel({ preset: "4w", fromDate: "", toDate: "" })).toBe(
      "4 weeks"
    );
    expect(
      formatHistoryRangeLabel({ preset: "today", fromDate: "", toDate: "" })
    ).toBe("today");
    expect(
      formatHistoryRangeLabel({ preset: "yesterday", fromDate: "", toDate: "" })
    ).toBe("yesterday");
    const custom: HistoryRangeState = {
      preset: "custom",
      fromDate: "2024-01-01",
      toDate: "2024-02-01",
    };
    expect(formatHistoryRangeLabel(custom)).toContain("2024-01-01");
  });
});

describe("shouldDismissRangePopover", () => {
  it("keeps open when click or focus inside root", () => {
    const inside = { nodeType: 1 } as unknown as Node;
    const outside = { nodeType: 1 } as unknown as Node;
    const root = {
      contains: (n: Node | null) => n === inside,
    };
    expect(
      shouldDismissRangePopover({
        root,
        eventTarget: inside,
        activeElement: null,
      })
    ).toBe(false);
    expect(
      shouldDismissRangePopover({
        root,
        eventTarget: outside,
        activeElement: inside as unknown as Element,
      })
    ).toBe(false);
  });

  it("dismisses when click and focus are outside", () => {
    const outside = { nodeType: 1 } as unknown as Node;
    const root = { contains: () => false };
    expect(
      shouldDismissRangePopover({
        root,
        eventTarget: outside,
        activeElement: outside as unknown as Element,
      })
    ).toBe(true);
  });

  it("keeps open while focused element is inside (native date calendar)", () => {
    const dateInput = { nodeType: 1 } as unknown as Element;
    const outsideClick = { nodeType: 1 } as unknown as Node;
    const root = {
      contains: (n: Node | null) => n === dateInput,
    };
    expect(
      shouldDismissRangePopover({
        root,
        eventTarget: outsideClick,
        activeElement: dateInput,
      })
    ).toBe(false);
  });
});
