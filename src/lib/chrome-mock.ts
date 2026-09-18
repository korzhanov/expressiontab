import {
  MOCK_BOOKMARKS,
  MOCK_HISTORY,
  MOCK_OPEN_TABS,
  filterByText,
  type MockBookmark,
  type MockOpenTab,
} from "./chrome-mock-data";

declare global {
  // eslint-disable-next-line no-var
  var __EXPRESSIONTAB_MOCK_CHROME__: boolean | undefined;
}

/** Есть ли настоящий Chrome Extension API. */
export function hasRealChromeApis(): boolean {
  try {
    return (
      typeof chrome !== "undefined" &&
      !!chrome?.history?.search &&
      !!chrome?.bookmarks?.search
    );
  } catch {
    return false;
  }
}

/**
 * В CursorBrowser / localhost нет chrome.history — ставим mock.
 * В unpacked-расширении не трогаем.
 */
export function installChromeMockIfNeeded(): boolean {
  if (hasRealChromeApis()) {
    globalThis.__EXPRESSIONTAB_MOCK_CHROME__ = false;
    return false;
  }

  const g = globalThis as typeof globalThis & { chrome?: any };
  const existing = g.chrome || {};
  // Живые копии — create/remove в preview меняют список
  const liveBookmarks: MockBookmark[] = MOCK_BOOKMARKS.map((b) => ({ ...b }));
  const liveTabs: MockOpenTab[] = MOCK_OPEN_TABS.map((t) => ({ ...t }));

  g.chrome = {
    ...existing,
    tabs: {
      query(
        query: { currentWindow?: boolean; active?: boolean },
        callback: (tabs: MockOpenTab[]) => void
      ) {
        let list = liveTabs.slice();
        if (query?.currentWindow) list = list.filter((t) => t.windowId === 1);
        if (query?.active) list = list.filter((t) => t.active);
        callback(list);
      },
      getCurrent(callback: (tab?: MockOpenTab) => void) {
        callback(liveTabs.find((t) => t.id === 1) || liveTabs[0]);
      },
      remove(tabIds: number | number[], callback?: () => void) {
        const ids = new Set(Array.isArray(tabIds) ? tabIds : [tabIds]);
        for (let i = liveTabs.length - 1; i >= 0; i--) {
          if (ids.has(liveTabs[i].id)) liveTabs.splice(i, 1);
        }
        callback?.();
      },
    },
    history: {
      search(
        query: { text?: string; maxResults?: number },
        callback: (results: unknown[]) => void
      ) {
        const list = filterByText(MOCK_HISTORY, query?.text || "");
        const max = query?.maxResults || 1000;
        setTimeout(() => callback(list.slice(0, max)), 30);
      },
      deleteUrl(_details: { url: string }, callback?: () => void) {
        callback?.();
      },
    },
    bookmarks: {
      search(query: string | { query?: string }) {
        const text =
          typeof query === "string" ? query : query?.query || "";
        return Promise.resolve(filterByText(liveBookmarks, text));
      },
      create(
        bookmark: { parentId?: string; url?: string; title?: string },
        callback?: (node: unknown) => void
      ) {
        const node = {
          id: "mock-" + Date.now() + "-" + liveBookmarks.length,
          url: bookmark.url || "",
          title: bookmark.title || "",
          dateAdded: Date.now(),
          parentId: bookmark.parentId,
        };
        // В dial попадают только URL; папки тоже кладём — search их отфильтрует
        liveBookmarks.push(node);
        callback?.(node);
      },
      remove(_id: string, callback?: () => void) {
        callback?.();
      },
    },
  };

  globalThis.__EXPRESSIONTAB_MOCK_CHROME__ = true;
  console.info(
    "[expressiontab] Chrome API mock — preview mode (CursorBrowser / localhost)"
  );
  return true;
}

export function isMockChrome(): boolean {
  return !!globalThis.__EXPRESSIONTAB_MOCK_CHROME__;
}
