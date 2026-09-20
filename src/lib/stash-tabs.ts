import { shouldIgnoreUrl, getHostFromUrl, type BookmarkNode, type HostGroup, SESSION_HOST_KEY } from "./bookmarks";

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

export function stashFolderTitle(
  allWindows: boolean,
  now = new Date(),
  opts?: { primaryHost?: string; tabCount?: number }
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  // Дата как 2026.09.19
  const stamp = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(
    now.getDate()
  )}`;
  const host = (opts?.primaryHost || "tabs").replace(/^www\./, "");
  const count = opts?.tabCount ?? 0;
  const countLabel =
    count > 0 ? `${host} and ${count}+ tabs` : `${host} tabs`;
  // allWindows — пометка «все», иначе только окно
  return allWindows
    ? `${stamp} ${countLabel} (all)`
    : `${stamp} ${countLabel}`;
}

/** Самый частый host среди вкладок — для имени папки stash. */
export function primaryHostFromTabs(tabs: TabLike[]): string {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    const url = tab.url || "";
    if (!/^https?:\/\//i.test(url)) continue;
    try {
      const h = new URL(url).hostname.replace(/^www\./, "") || "tabs";
      counts.set(h, (counts.get(h) || 0) + 1);
    } catch {
      // ignore
    }
  }
  let best = "tabs";
  let bestN = 0;
  for (const [h, n] of counts) {
    if (n > bestN) {
      best = h;
      bestN = n;
    }
  }
  return best;
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
      title: stashFolderTitle(allWindows, now, {
        primaryHost: primaryHostFromTabs(plan.bookmarks.map((b) => ({
          url: b.url,
          title: b.title,
        }))),
        tabCount: plan.closeIds.length,
      }),
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

/**
 * Собрать открытые вкладки в session-группу для верхних рядов dial.
 * primary — первая вкладка; остальные — дети группы.
 */
export function buildOpenTabsSession({
  tabs,
  currentTabId,
  now = Date.now(),
}: {
  tabs: TabLike[];
  currentTabId?: number;
  now?: number;
}): { nodes: BookmarkNode[]; group: HostGroup } | null {
  const nodes: BookmarkNode[] = [];
  for (const tab of tabs) {
    if (tab.id == null) continue;
    if (currentTabId != null && tab.id === currentTabId) continue;
    if (shouldIgnoreUrl(tab.url)) continue;
    const url = (tab.url || "").trim();
    let host = "localhost";
    try {
      host = getHostFromUrl(url);
    } catch {
      continue;
    }
    nodes.push({
      url,
      title: (tab.title || host).trim() || host,
      visitCount: 8,
      lastVisitTime: now,
      // Session: момент появления в dial (для «Open for»)
      openedAt: now,
      host,
      isSession: true,
      id: `tab:${tab.id}`,
    });
  }
  if (!nodes.length) return null;
  const primary = primaryHostFromTabs(tabs);
  // Заголовок группы: «Open tabs · example.com · N»
  nodes[0] = {
    ...nodes[0],
    title: `Open tabs · ${primary} · ${nodes.length}`,
    host: SESSION_HOST_KEY,
    hostVisitCount: nodes.length * 8,
    openedAt: now,
  };
  const group: HostGroup = {
    nodes: nodes.map((_, i) => i),
    hostVisitCount: nodes.length * 8,
    hostLastVisitTime: now,
    host: SESSION_HOST_KEY,
    isSession: true,
  };
  return { nodes, group };
}

/** Вставить session-группу в начало индекса (верхние ряды). */
export function mergeSessionIntoIndex({
  bookmarkList,
  nodesList,
  session,
}: {
  bookmarkList: Map<string, HostGroup>;
  nodesList: BookmarkNode[];
  session: { nodes: BookmarkNode[]; group: HostGroup };
}): {
  bookmarkList: Map<string, HostGroup>;
  nodesList: BookmarkNode[];
} {
  const offset = session.nodes.length;
  // Сдвинуть индексы существующих групп
  const nextMap = new Map<string, HostGroup>();
  nextMap.set(SESSION_HOST_KEY, {
    ...session.group,
    nodes: session.nodes.map((_, i) => i),
  });
  for (const [host, g] of bookmarkList) {
    if (host === SESSION_HOST_KEY) continue;
    nextMap.set(host, {
      ...g,
      nodes: g.nodes.map((i) => i + offset),
    });
  }
  return {
    bookmarkList: nextMap,
    nodesList: [...session.nodes, ...nodesList],
  };
}

/** Загрузить вкладки текущего окна для session-пузырьков. */
export async function loadOpenTabsForSession(
  chromeApi: StashChrome
): Promise<{ nodes: BookmarkNode[]; group: HostGroup } | null> {
  const current = await tabsGetCurrent(chromeApi);
  const tabs = await tabsQuery(chromeApi, { currentWindow: true });
  return buildOpenTabsSession({ tabs, currentTabId: current?.id });
}
