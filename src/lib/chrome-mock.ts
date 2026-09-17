import {
  MOCK_BOOKMARKS,
  MOCK_HISTORY,
  filterByText,
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

  g.chrome = {
    ...existing,
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
        return Promise.resolve(filterByText(MOCK_BOOKMARKS, text));
      },
      create(
        _bookmark: { url?: string; title?: string },
        callback?: (node: unknown) => void
      ) {
        callback?.({ id: "mock-" + Date.now() });
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
