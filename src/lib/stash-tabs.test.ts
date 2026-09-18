import { describe, expect, it } from "bun:test";
import {
  isStashableTab,
  planStash,
  stashFolderTitle,
  stashOpenTabs,
  buildOpenTabsSession,
  mergeSessionIntoIndex,
  primaryHostFromTabs,
  type StashChrome,
  type TabLike,
} from "./stash-tabs";
import { SESSION_HOST_KEY } from "./bookmarks";

const tabs: TabLike[] = [
  { id: 1, url: "chrome-extension://abc/newtab/index.html", title: "NT", windowId: 1 },
  { id: 2, url: "https://a.example/one", title: "A1", windowId: 1 },
  { id: 3, url: "https://a.example/one", title: "A1 dup", windowId: 1 },
  { id: 4, url: "chrome://settings", title: "Settings", windowId: 1 },
  { id: 5, url: "https://b.example/", title: "B", pinned: true, windowId: 1 },
  { id: 6, url: "https://c.example/", title: "C", windowId: 2 },
];

describe("isStashableTab / planStash", () => {
  it("skips current, pinned and non-http tabs", () => {
    expect(isStashableTab(tabs[0], 1)).toBe(false);
    expect(isStashableTab(tabs[3], 1)).toBe(false);
    expect(isStashableTab(tabs[4], 1)).toBe(false);
    expect(isStashableTab(tabs[1], 1)).toBe(true);
  });

  it("dedupes urls for bookmarks but closes every stashable tab", () => {
    const plan = planStash(tabs, 1);
    expect(plan.bookmarks.map((b) => b.url)).toEqual([
      "https://a.example/one",
      "https://c.example/",
    ]);
    expect(plan.closeIds).toEqual([2, 3, 6]);
  });
});

describe("stashFolderTitle", () => {
  it("labels dated folder with primary host and tab count", () => {
    const now = new Date(2026, 8, 18, 3, 5);
    expect(stashFolderTitle(false, now, { primaryHost: "google.com", tabCount: 160 })).toBe(
      "2026.09.18 google.com and 160+ tabs"
    );
    expect(stashFolderTitle(true, now, { primaryHost: "a.example", tabCount: 12 })).toBe(
      "2026.09.18 a.example and 12+ tabs (all)"
    );
  });
});

function fakeChrome(all: TabLike[]) {
  const created: { parentId?: string; title?: string; url?: string; id: string }[] = [];
  const removed: number[] = [];
  let n = 0;
  const api: StashChrome = {
    tabs: {
      query(q, cb) {
        const list = q.currentWindow
          ? all.filter((t) => t.windowId === 1)
          : all;
        cb(list);
      },
      getCurrent(cb) {
        cb(all.find((t) => t.id === 1));
      },
      remove(ids, cb) {
        removed.push(...(Array.isArray(ids) ? ids : [ids]));
        cb?.();
      },
    },
    bookmarks: {
      create(bm, cb) {
        const node = { id: "n" + n++, ...bm };
        created.push(node);
        cb?.(node);
      },
    },
  };
  return { api, created, removed };
}

describe("stashOpenTabs", () => {
  it("stashes only current window into a folder then closes", async () => {
    const fake = fakeChrome(tabs);
    const result = await stashOpenTabs({
      allWindows: false,
      chromeApi: fake.api,
      now: new Date(2026, 8, 18, 3, 5),
    });
    expect(result.bookmarked).toBe(1);
    expect(result.closed).toBe(2);
    expect(fake.created[0].title).toBe("2026.09.18 a.example and 2+ tabs");
    expect(fake.created[1].url).toBe("https://a.example/one");
    expect(fake.created[1].parentId).toBe(fake.created[0].id);
    expect(fake.removed).toEqual([2, 3]);
  });

  it("stashes all windows", async () => {
    const fake = fakeChrome(tabs);
    const result = await stashOpenTabs({
      allWindows: true,
      chromeApi: fake.api,
    });
    expect(result.bookmarked).toBe(2);
    expect(result.closed).toBe(3);
    expect(fake.removed).toEqual([2, 3, 6]);
  });

  it("does nothing when nothing to stash", async () => {
    const fake = fakeChrome([tabs[0], tabs[4]]);
    const result = await stashOpenTabs({
      allWindows: true,
      chromeApi: fake.api,
    });
    expect(result).toEqual({ bookmarked: 0, closed: 0, skipped: 2 });
    expect(fake.created).toEqual([]);
    expect(fake.removed).toEqual([]);
  });
});

describe("open tabs session", () => {
  it("primaryHostFromTabs picks the most common host", () => {
    expect(
      primaryHostFromTabs([
        { url: "https://a.example/1" },
        { url: "https://b.example/1" },
        { url: "https://a.example/2" },
      ])
    ).toBe("a.example");
  });

  it("buildOpenTabsSession skips current and non-http", () => {
    const session = buildOpenTabsSession({
      tabs,
      currentTabId: 1,
    });
    expect(session).toBeTruthy();
    expect(session!.group.isSession).toBe(true);
    expect(session!.group.host).toBe(SESSION_HOST_KEY);
    // tabs 2,3,6 stashable-ish; 4 chrome, 5 pinned still included if http
    // buildOpenTabsSession only skips current + shouldIgnoreUrl (pinned OK for display)
    expect(session!.nodes.length).toBeGreaterThanOrEqual(3);
    expect(session!.nodes[0].title).toContain("Open tabs");
  });

  it("mergeSessionIntoIndex prepends session and shifts indexes", () => {
    const session = buildOpenTabsSession({
      tabs: [
        { id: 10, url: "https://x.test/", title: "X" },
        { id: 11, url: "https://y.test/", title: "Y" },
      ],
    })!;
    const bookmarkList = new Map([
      ["old.test", { nodes: [0], hostVisitCount: 1, host: "old.test" }],
    ]);
    const nodesList = [{ url: "https://old.test/", title: "Old" }];
    const merged = mergeSessionIntoIndex({ bookmarkList, nodesList, session });
    expect([...merged.bookmarkList.keys()][0]).toBe(SESSION_HOST_KEY);
    expect(merged.bookmarkList.get("old.test")!.nodes[0]).toBe(session.nodes.length);
    expect(merged.nodesList[0].isSession).toBe(true);
  });
});
