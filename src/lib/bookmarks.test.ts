import { describe, expect, it } from "bun:test";
import {
  shouldIgnoreUrl,
  makeChunks,
  buildBookmarkIndex,
  getUnfoldSlice,
  UNFOLD_PAGE_SIZE,
  type HostGroup,
} from "./bookmarks";
import { clamp, bgOpacityFromScroll, ignoreUrl } from "./utils";

describe("shouldIgnoreUrl", () => {
  it("rejects empty and chrome: urls", () => {
    expect(shouldIgnoreUrl(undefined)).toBe(true);
    expect(shouldIgnoreUrl("")).toBe(true);
    expect(shouldIgnoreUrl("chrome://extensions")).toBe(true);
    expect(shouldIgnoreUrl("chrome-extension://abc")).toBe(true);
  });

  it("allows https urls", () => {
    expect(shouldIgnoreUrl("https://example.com")).toBe(false);
  });

  it("matches every ignoreUrl prefix", () => {
    for (const prefix of ignoreUrl) {
      expect(shouldIgnoreUrl(prefix + "x")).toBe(true);
    }
  });
});

describe("buildBookmarkIndex", () => {
  it("groups by host and sets weights", () => {
    const { bookmarkList, nodesList, maxVisits } = buildBookmarkIndex(
      [
        { url: "https://a.example/one", title: "A1", visitCount: 10 },
        { url: "https://a.example/two", title: "A2", visitCount: 5 },
        { url: "https://b.example/", title: "B", visitCount: 2 },
        { url: "chrome://settings", title: "skip" },
      ],
      [{ url: "https://a.example/bm", title: "star" }]
    );
    expect(bookmarkList.size).toBe(2);
    expect(nodesList.length).toBe(4);
    expect(bookmarkList.get("a.example")?.nodes.length).toBe(3);
    expect(maxVisits).toBeGreaterThanOrEqual(1);
    expect(nodesList.some((n) => n.isBookmark)).toBe(true);
  });
});

describe("makeChunks", () => {
  it("packs hosts into bubble rows by width", () => {
    const map = new Map<string, HostGroup>([
      ["a.com", { nodes: [0], weightVisitsRadius: 50, host: "a.com" }],
      ["b.com", { nodes: [1], weightVisitsRadius: 50, host: "b.com" }],
    ]);
    const nodes = [
      { url: "https://a.com", weightVisitsRadius: 50 },
      { url: "https://b.com", weightVisitsRadius: 50 },
    ];
    const rows = makeChunks(map, nodes, 400, false);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].key).toMatch(/^row-/);
  });

  it("puts one host per row in lined view", () => {
    const map = new Map<string, HostGroup>([
      ["a.com", { nodes: [0], weightVisitsRadius: 50, host: "a.com" }],
      ["b.com", { nodes: [1], weightVisitsRadius: 50, host: "b.com" }],
    ]);
    const nodes = [{ url: "https://a.com" }, { url: "https://b.com" }];
    const rows = makeChunks(map, nodes, 800, true);
    expect(rows.length).toBe(2);
    expect(rows[0].key).toMatch(/^lined-/);
    expect(rows[0].value.length).toBe(1);
  });
});

describe("getUnfoldSlice", () => {
  it("pages children with UNFOLD_PAGE_SIZE", () => {
    const indexes = Array.from({ length: 40 }, (_, i) => i);
    const first = getUnfoldSlice(indexes, UNFOLD_PAGE_SIZE);
    expect(first.visible.length).toBe(UNFOLD_PAGE_SIZE);
    expect(first.hasMore).toBe(true);
    const next = getUnfoldSlice(indexes, first.nextCount);
    expect(next.visible.length).toBe(40);
    expect(next.hasMore).toBe(false);
  });
});

describe("utils clamp / bgOpacity", () => {
  it("clamps values", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it("bg opacity is 1 at top and 0 after full viewport scroll", () => {
    expect(bgOpacityFromScroll(0, 1000)).toBe(1);
    expect(bgOpacityFromScroll(1000, 1000)).toBe(0);
    expect(bgOpacityFromScroll(500, 1000)).toBe(0.5);
  });
});
