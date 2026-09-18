import { describe, expect, it, beforeEach } from "bun:test";
import {
  installChromeMockIfNeeded,
  hasRealChromeApis,
  isMockChrome,
} from "./chrome-mock";
import { filterByText, MOCK_HISTORY } from "./chrome-mock-data";

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
