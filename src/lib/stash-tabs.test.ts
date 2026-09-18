import { describe, expect, it } from "bun:test";
import {
  isStashableTab,
  planStash,
  stashFolderTitle,
  stashOpenTabs,
  type StashChrome,
  type TabLike,
} from "./stash-tabs";

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
  it("labels window vs all with a timestamp", () => {
    const now = new Date(2026, 8, 18, 3, 5);
    expect(stashFolderTitle(false, now)).toBe("ExpressionTab · окно · 2026-09-18 03:05");
    expect(stashFolderTitle(true, now)).toBe("ExpressionTab · все · 2026-09-18 03:05");
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
    expect(fake.created[0].title).toBe("ExpressionTab · окно · 2026-09-18 03:05");
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
