import { describe, expect, it } from "bun:test";
import {
  OLD_BOOKMARK_DAYS,
  STALE_VISIT_DAYS,
  buildAnchorTooltip,
  formatDateShort,
  formatOpenDuration,
  isLongOpen,
  isOldBookmark,
  isStaleVisit,
} from "./age-format";

const day = 24 * 60 * 60 * 1000;
const hour = 60 * 60 * 1000;

describe("age-format", () => {
  it("formatDateShort returns locale date", () => {
    const s = formatDateShort(Date.UTC(2024, 0, 15));
    expect(s.length).toBeGreaterThan(0);
  });

  it("isStaleVisit after threshold days", () => {
    const now = Date.UTC(2025, 0, 1);
    expect(isStaleVisit(now - (STALE_VISIT_DAYS - 1) * day, now)).toBe(false);
    expect(isStaleVisit(now - STALE_VISIT_DAYS * day, now)).toBe(true);
  });

  it("isOldBookmark after threshold days", () => {
    const now = Date.UTC(2025, 0, 1);
    expect(isOldBookmark(now - (OLD_BOOKMARK_DAYS - 1) * day, now)).toBe(false);
    expect(isOldBookmark(now - OLD_BOOKMARK_DAYS * day, now)).toBe(true);
  });

  it("formatOpenDuration and isLongOpen", () => {
    const now = 1_700_000_000_000;
    expect(formatOpenDuration(now - 30 * 60 * 1000, now)).toBe("Open for 30m");
    expect(formatOpenDuration(now - 5 * hour, now)).toBe("Open for 5h");
    expect(formatOpenDuration(now - 3 * day, now)).toBe("Open for 3d");
    expect(isLongOpen(now - 9 * hour, now)).toBe(true);
    expect(isLongOpen(now - 2 * hour, now)).toBe(false);
  });

  it("buildAnchorTooltip includes last visit and added for bookmarks", () => {
    const now = Date.UTC(2025, 6, 1);
    const tip = buildAnchorTooltip({
      title: "Docs",
      visitCount: 2,
      lastVisitTime: now - 10 * day,
      dateAdded: now - (OLD_BOOKMARK_DAYS + 1) * day,
      isBookmark: true,
      now,
    });
    expect(tip.text).toContain("Docs");
    expect(tip.text).toContain("2 visits");
    expect(tip.text).toContain("Last visit:");
    expect(tip.text).toContain("Added:");
    expect(tip.text).toContain("(old)");
    expect(tip.oldBookmark).toBe(true);
    expect(tip.aged).toBe(true);
  });

  it("buildAnchorTooltip session uses open duration not visit count", () => {
    const now = Date.UTC(2025, 6, 1);
    const tip = buildAnchorTooltip({
      title: "Open tabs · x · 2",
      visitCount: 8,
      isSession: true,
      openedAt: now - 10 * hour,
      now,
    });
    expect(tip.text).not.toContain("visit");
    expect(tip.text).toContain("Open for 10h");
    expect(tip.text).toContain("(long)");
    expect(tip.longOpen).toBe(true);
  });
});
