import { shouldIgnoreUrl } from "./bookmarks";

/** Минимальный Tab — и для chrome.tabs, и для тестов. */
export type TabLike = {
  id?: number;
  url?: string;
  title?: string;
  pinned?: boolean;
  windowId?: number;
};

/** Подмножество chrome.* для переноса вкладок (без permission `tabs`). */
export type StashChrome = {
  tabs: {
    query: (
      query: { currentWindow?: boolean; active?: boolean },
      callback: (tabs: TabLike[]) => void
    ) => void;
    getCurrent?: (callback: (tab?: TabLike) => void) => void;
    remove: (tabIds: number | number[], callback?: () => void) => void;
  };
  bookmarks: {
    create: (
      bookmark: { parentId?: string; title?: string; url?: string },
      callback?: (node: { id?: string }) => void
    ) => void | Promise<{ id?: string }>;
  };
};

export type StashPlan = {
  /** Уникальные URL → закладки */
  bookmarks: { url: string; title: string }[];
  /** Все stashable id — закроем после успешного create */
  closeIds: number[];
};

export type StashResult = {
  bookmarked: number;
  closed: number;
  skipped: number;
};

/** Текущий new-tab, pinned и не-http(s) не переносим. */
export function isStashableTab(
  tab: TabLike,
  currentTabId?: number
): boolean {
  if (tab.id == null) return false;
  if (currentTabId != null && tab.id === currentTabId) return false;
  if (tab.pinned) return false;
  return !shouldIgnoreUrl(tab.url);
}

/** План: уникальные закладки + id на закрытие. */
export function planStash(tabs: TabLike[], currentTabId?: number): StashPlan {
  const closeIds: number[] = [];
  const seen = new Set<string>();
  const bookmarks: StashPlan["bookmarks"] = [];
  for (const tab of tabs) {
    if (!isStashableTab(tab, currentTabId)) continue;
    closeIds.push(tab.id as number);
    const url = (tab.url || "").trim();
    if (seen.has(url)) continue;
    seen.add(url);
    bookmarks.push({ url, title: (tab.title || url).trim() || url });
  }
  return { bookmarks, closeIds };
}

export function stashFolderTitle(allWindows: boolean, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return allWindows
    ? `ExpressionTab · все · ${stamp}`
    : `ExpressionTab · окно · ${stamp}`;
}

function tabsQuery(
  api: StashChrome,
  query: { currentWindow?: boolean }
): Promise<TabLike[]> {
  return new Promise((resolve) => {
    api.tabs.query(query, (tabs) => resolve(tabs || []));
  });
}

function tabsGetCurrent(api: StashChrome): Promise<TabLike | undefined> {
  return new Promise((resolve) => {
    if (typeof api.tabs.getCurrent !== "function") {
      resolve(undefined);
      return;
    }
    api.tabs.getCurrent((tab) => resolve(tab));
  });
}

function bookmarkCreate(
  api: StashChrome,
  bookmark: { parentId?: string; title?: string; url?: string }
): Promise<{ id?: string }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (node?: { id?: string }) => {
      if (settled) return;
      settled = true;
      resolve(node || {});
    };
    try {
      const ret = api.bookmarks.create(bookmark, done);
      // MV3: без callback create возвращает Promise
      if (ret && typeof (ret as Promise<unknown>).then === "function") {
        (ret as Promise<{ id?: string }>).then(done, (err) => {
          if (settled) return;
          settled = true;
          reject(err);
        });
      }
    } catch (err) {
      reject(err);
    }
  });
}

function tabsRemove(api: StashChrome, ids: number[]): Promise<void> {
  if (!ids.length) return Promise.resolve();
  return new Promise((resolve) => {
    api.tabs.remove(ids, () => resolve());
  });
}

/**
 * Сохранить http(s) вкладки в папку закладок и закрыть их.
 * current new-tab и pinned не трогаем. Permission `tabs` не нужен (`<all_urls>`).
 */
export async function stashOpenTabs({
  allWindows,
  chromeApi,
  now,
}: {
  allWindows: boolean;
  chromeApi: StashChrome;
  now?: Date;
}): Promise<StashResult> {
  const current = await tabsGetCurrent(chromeApi);
  const tabs = await tabsQuery(
    chromeApi,
    allWindows ? {} : { currentWindow: true }
  );
  const plan = planStash(tabs, current?.id);
  const skipped = Math.max(0, tabs.length - plan.closeIds.length);
  if (!plan.bookmarks.length) {
    return { bookmarked: 0, closed: 0, skipped };
  }

  let parentId: string | undefined;
  try {
    const folder = await bookmarkCreate(chromeApi, {
      title: stashFolderTitle(allWindows, now),
    });
    parentId = folder?.id;
  } catch {
    parentId = undefined;
  }

  let bookmarked = 0;
  for (const item of plan.bookmarks) {
    try {
      await bookmarkCreate(chromeApi, {
        parentId,
        title: item.title,
        url: item.url,
      });
      bookmarked += 1;
    } catch (err) {
      console.error(err);
    }
  }

  // Закрываем только если хотя бы одна закладка создалась
  if (bookmarked > 0) {
    await tabsRemove(chromeApi, plan.closeIds);
  }

  return {
    bookmarked,
    closed: bookmarked > 0 ? plan.closeIds.length : 0,
    skipped,
  };
}
