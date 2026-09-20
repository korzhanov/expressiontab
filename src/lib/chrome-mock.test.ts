import { describe, expect, it, beforeEach } from "bun:test";
import {
  installChromeMockIfNeeded,
  hasRealChromeApis,
  isMockChrome,
} from "./chrome-mock";
import {
  buildBulkMockHistory,
  filterByText,
  filterByVisitTime,
  MOCK_BULK_HISTORY_COUNT,
  MOCK_HISTORY,
  MOCK_HISTORY_CURATED,
  MOCK_HISTORY_WEEKS,
} from "./chrome-mock-data";

describe("chrome-mock-data filterByText", () => {
  it("returns all for empty or h query", () => {
    expect(filterByText(MOCK_HISTORY, "").length).toBe(MOCK_HISTORY.length);
    expect(filterByText(MOCK_HISTORY, "h").length).toBe(MOCK_HISTORY.length);
  });

  it("filters by title substring", () => {
    const r = filterByText(MOCK_HISTORY, "svelte");
    expect(r.length).toBeGreaterThanOrEqual(1);
    expect(r.every((i) => /svelte/i.test(i.title + i.url))).toBe(true);
  });
});

describe("chrome-mock-data bulk history", () => {
  it("adds 1800 items spanning 12 weeks", () => {
    expect(MOCK_BULK_HISTORY_COUNT).toBe(1800);
    expect(MOCK_HISTORY_WEEKS).toBe(12);
    expect(MOCK_HISTORY.length).toBe(
      MOCK_HISTORY_CURATED.length + MOCK_BULK_HISTORY_COUNT
    );
    const bulk = buildBulkMockHistory({ count: 1800, weeks: 12, nowMs: 1e12 });
    expect(bulk.length).toBe(1800);
    const span = 12 * 7 * 86400000;
    const times = bulk.map((b) => b.lastVisitTime);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    // Все визиты внутри окна 12 недель от nowMs
    expect(maxT).toBeLessThanOrEqual(1e12);
    expect(minT).toBeGreaterThanOrEqual(1e12 - span - 86400000);
    // Разброс покрывает большую часть горизонта (не только «вчера»)
    expect(maxT - minT).toBeGreaterThan(span * 0.7);
  });

  it("filterByVisitTime respects start/end", () => {
    const nowMs = Date.now();
    const week = 7 * 86400000;
    const inRange = filterByVisitTime(MOCK_HISTORY, nowMs - week, nowMs);
    expect(inRange.length).toBeGreaterThan(0);
    expect(inRange.length).toBeLessThan(MOCK_HISTORY.length);
    expect(
      inRange.every(
        (i) => i.lastVisitTime >= nowMs - week && i.lastVisitTime <= nowMs
      )
    ).toBe(true);
  });
});

describe("installChromeMockIfNeeded", () => {
  beforeEach(() => {
    // сброс для повторных запусков в том же процессе
    // @ts-expect-error test cleanup
    delete globalThis.chrome;
    globalThis.__EXPRESSIONTAB_MOCK_CHROME__ = undefined;
  });

  it("installs mock when chrome APIs missing", () => {
    expect(hasRealChromeApis()).toBe(false);
    expect(installChromeMockIfNeeded()).toBe(true);
    expect(isMockChrome()).toBe(true);
    expect(typeof chrome.history.search).toBe("function");
  });

  it("history.search returns mock items via callback", async () => {
    installChromeMockIfNeeded();
    const results = await new Promise<any[]>((resolve) => {
      chrome.history.search({ text: "github", maxResults: 10 }, resolve);
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toContain("http");
  });

  it("history.search respects startTime and maxResults for bulk", async () => {
    installChromeMockIfNeeded();
    const nowMs = Date.now();
    const results = await new Promise<any[]>((resolve) => {
      chrome.history.search(
        {
          text: "",
          startTime: nowMs - 12 * 7 * 86400000,
          endTime: nowMs,
          maxResults: 2500,
        },
        resolve
      );
    });
    expect(results.length).toBeGreaterThan(1000);
    expect(results.length).toBeLessThanOrEqual(2500);
  });

  it("bookmarks.search returns a promise", async () => {
    installChromeMockIfNeeded();
    const results = await chrome.bookmarks.search("svelte");
    expect(Array.isArray(results)).toBe(true);
  });

  it("tabs.query returns current-window mock tabs", async () => {
    installChromeMockIfNeeded();
    const tabs = await new Promise<any[]>((resolve) => {
      chrome.tabs.query({ currentWindow: true }, resolve);
    });
    expect(tabs.length).toBeGreaterThan(0);
    expect(tabs.every((t) => t.windowId === 1)).toBe(true);
  });
});
