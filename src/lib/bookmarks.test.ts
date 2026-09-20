import { describe, expect, it } from "bun:test";
import {
  shouldIgnoreUrl,
  makeChunks,
  buildBookmarkIndex,
  getUnfoldSlice,
  UNFOLD_PAGE_SIZE,
  faviconSourceUrls,
  chromeFaviconUrl,
  resolveFaviconSrc,
  faviconPageKey,
  wantsPageFavicon,
  FAVICON_MISS,
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

  it("rejects non-http schemes and blank", () => {
    expect(shouldIgnoreUrl("   ")).toBe(true);
    expect(shouldIgnoreUrl("about:blank")).toBe(true);
    expect(shouldIgnoreUrl("not-a-url")).toBe(true);
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

  it("keeps max lastVisitTime per host", () => {
    const t1 = 1000;
    const t2 = 5000;
    const { bookmarkList } = buildBookmarkIndex(
      [
        { url: "https://a.example/1", visitCount: 1, lastVisitTime: t1 },
        { url: "https://a.example/2", visitCount: 1, lastVisitTime: t2 },
      ],
      []
    );
    expect(bookmarkList.get("a.example")?.hostLastVisitTime).toBe(t2);
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

describe("favicon quiet load", () => {
  it("faviconSourceUrls order: s2 32 → ico → (chrome) → s2; no sz=64", () => {
    const urls = faviconSourceUrls(
      "https://dead.example/remote-workers?x=1"
    );
    expect(urls[0]).toContain("domain=dead.example");
    expect(urls[0]).toContain("sz=32");
    expect(urls[1]).toBe("https://dead.example/favicon.ico");
    // sz=64 не используем — то же пиксельное s2
    expect(urls.every((u) => !u.includes("sz=64"))).toBe(true);
    const last = urls[urls.length - 1];
    expect(last).toContain("domain=dead.example");
    expect(last).not.toContain("sz=");
    expect(urls.some((u) => u.includes("remote-workers"))).toBe(false);
  });

  it("pageSpecific: Chrome full pageUrl first (Docs/Notion)", () => {
    const prev = (globalThis as { chrome?: unknown }).chrome;
    (globalThis as { chrome?: unknown }).chrome = {
      runtime: {
        getURL: (p: string) => `chrome-extension://testid${p}`,
      },
    };
    try {
      const doc =
        "https://docs.google.com/document/d/xxxx/edit#heading=h.1";
      const urls = faviconSourceUrls(doc, { pageSpecific: true });
      // Полный pageUrl в первом кандидате
      expect(urls[0]).toContain("/_favicon/");
      expect(urls[0]).toContain(encodeURIComponent(doc));
      expect(urls[0]).toContain("size=64");
      // Потом host s2
      expect(urls.some((u) => u.includes("domain=docs.google.com"))).toBe(
        true
      );
    } finally {
      (globalThis as { chrome?: unknown }).chrome = prev;
    }
  });

  it("faviconPageKey strips query/hash; wantsPageFavicon for deep paths", () => {
    expect(
      faviconPageKey(
        "https://docs.google.com/spreadsheets/d/abc/edit#gid=1"
      )
    ).toBe("docs.google.com/spreadsheets/d/abc/edit");
    expect(
      faviconPageKey("https://www.notion.so/Workspace/Page-xyz?v=1")
    ).toBe("www.notion.so/Workspace/Page-xyz");
    expect(wantsPageFavicon("https://docs.google.com/")).toBe(false);
    expect(
      wantsPageFavicon("https://docs.google.com/document/d/xxxx/edit")
    ).toBe(true);
  });

  it("skips s2/ico for localhost and raw IP", () => {
    expect(faviconSourceUrls("http://127.0.0.1:7860/")).toEqual([]);
    expect(faviconSourceUrls("http://localhost:3000/")).toEqual([]);
  });

  it("resolveFaviconSrc: page → host → globe; ignores miss", () => {
    const map = new Map([
      ["x.com", FAVICON_MISS],
      ["docs.google.com/document/d/a/edit", "data:page"],
      ["docs.google.com", "data:host"],
    ]);
    expect(resolveFaviconSrc("x.com", map, "globe.svg")).toBe("globe.svg");
    // Page выигрывает у host
    expect(
      resolveFaviconSrc(
        "docs.google.com",
        map,
        "globe.svg",
        "https://docs.google.com/document/d/a/edit"
      )
    ).toBe("data:page");
    // Нет page — host
    expect(
      resolveFaviconSrc(
        "docs.google.com",
        map,
        "globe.svg",
        "https://docs.google.com/forms/d/missing/viewform"
      )
    ).toBe("data:host");
  });

  it("chromeFaviconUrl builds _favicon URL when chrome.runtime exists", () => {
    const prev = (globalThis as { chrome?: unknown }).chrome;
    (globalThis as { chrome?: unknown }).chrome = {
      runtime: {
        getURL: (p: string) => `chrome-extension://testid${p}`,
      },
    };
    try {
      const u = chromeFaviconUrl("https://ex.com/", 64);
      expect(u).toContain("chrome-extension://testid/_favicon/");
      expect(u).toContain("pageUrl=");
      expect(u).toContain("size=64");
      // Порядок host: s2 32 → ico → Chrome → s2
      const urls = faviconSourceUrls("https://ex.com/path");
      expect(urls[0]).toContain("sz=32");
      expect(urls[1]).toBe("https://ex.com/favicon.ico");
      expect(urls[2]).toContain("/_favicon/");
      expect(urls[3]).toContain("domain=ex.com");
      expect(urls[3]).not.toContain("sz=");
    } finally {
      (globalThis as { chrome?: unknown }).chrome = prev;
    }
  });
});
