import { ignoreUrl } from "./utils";

export type HostGroup = {
  nodes: number[];
  hostVisitCount?: number;
  weightVisits?: number;
  weightVisitsRadius?: number;
  host?: string;
  /** Максимальный lastVisitTime среди URL хоста */
  hostLastVisitTime?: number;
  /** Группа открытых вкладок (session) — верх ряда, другой цвет */
  isSession?: boolean;
};

export type ChunkRow = {
  key: string;
  value: HostGroup[];
  width: number;
};

export type BookmarkNode = {
  url?: string;
  title?: string;
  visitCount?: number;
  /** chrome.history lastVisitTime (ms) */
  lastVisitTime?: number;
  hostVisitCount?: number;
  weightVisits?: number;
  weightVisitsRadius?: number;
  host?: string;
  isBookmark?: boolean;
  id?: number | string;
  img_data?: string;
  /** Узел из открытых вкладок */
  isSession?: boolean;
  [key: string]: unknown;
};

/** Служебный host для группы открытых вкладок окна. */
export const SESSION_HOST_KEY = "__session-tabs__";

/** Returns true if the URL should be filtered out of the dial. */
export function shouldIgnoreUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  // В dial только http(s); chrome:/javascript:/relative и т.п. отсекаем
  if (!/^https?:\/\//i.test(trimmed)) return true;
  return ignoreUrl.some((prefix) => trimmed.startsWith(prefix));
}

/** Host из URL; при битой ссылке — localhost, без throw. */
export function getHostFromUrl(url: string): string {
  try {
    return new URL(url).host.split(":")[0] || "localhost";
  } catch {
    return "localhost";
  }
}

/** Проверка, что строка — валидный абсолютный URL. */
export function isValidHttpUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function computeWeightVisits(visitCount: number): number {
  return Math.log10(Math.max(visitCount, 1));
}

export function computeWeightVisitsRadius(weightVisits: number): number {
  return Math.ceil(weightVisits * 10) + 10 + 50;
}

/**
 * Pack host groups into visual rows for bubble (dial) view,
 * or one host per row for lined (list) view.
 */
export function makeChunks(
  bookmarkList: Map<string, HostGroup>,
  nodesList: BookmarkNode[],
  windowWidth: number,
  titleVisible = false
): ChunkRow[] {
  const chankList: ChunkRow[] = [];

  bookmarkList.forEach((value, hostKey) => {
    const group: HostGroup = { ...value, host: hostKey };
    const firstNode = nodesList[group.nodes[0]];
    const itemWidth =
      (group.weightVisitsRadius ?? 0) * 2 ||
      (firstNode?.weightVisitsRadius ?? 0) * 2 ||
      150;

    if (titleVisible) {
      chankList.push({
        key: `lined-${hostKey}`,
        value: [group],
        width: windowWidth || itemWidth,
      });
      return;
    }

    const last = chankList[chankList.length - 1];
    if (last && last.width + itemWidth <= windowWidth - 50) {
      last.value.push(group);
      last.width = last.width + itemWidth;
      last.key = `row-${last.value.map((g) => g.host || g.nodes[0]).join("-")}`;
    } else {
      chankList.push({
        key: `row-${hostKey}`,
        value: [group],
        width: itemWidth,
      });
    }
  });

  return chankList;
}

/**
 * Merge history + bookmarks into a host Map and flat nodes list.
 */
export function buildBookmarkIndex(
  historyItems: BookmarkNode[],
  bookmarkItems: BookmarkNode[]
): {
  bookmarkList: Map<string, HostGroup>;
  nodesList: BookmarkNode[];
  maxVisits: number;
} {
  const bookmarkList = new Map<string, HostGroup>();
  const nodesList: BookmarkNode[] = [];
  let maxVisits = 1;

  const all: BookmarkNode[] = [
    ...historyItems,
    ...bookmarkItems.map((b) => ({ ...b, isBookmark: true })),
  ];

  for (const c of all) {
    if (shouldIgnoreUrl(c.url)) continue;

    let host = "localhost";
    try {
      host = getHostFromUrl(c.url as string);
    } catch {
      continue;
    }

    c.host = host;
    const visitTs =
      typeof c.lastVisitTime === "number" ? c.lastVisitTime : undefined;

    if (bookmarkList.has(host)) {
      const bmitems = bookmarkList.get(host) as HostGroup;
      bmitems.hostVisitCount =
        (bmitems.hostVisitCount ? bmitems.hostVisitCount * 1 : 1) +
        (c.visitCount || 1);
      if (visitTs != null) {
        bmitems.hostLastVisitTime = Math.max(
          bmitems.hostLastVisitTime || 0,
          visitTs
        );
      }
      maxVisits = Math.max(maxVisits, bmitems.hostVisitCount);
      c.weightVisits = computeWeightVisits(
        Math.max(c.visitCount || 1, c.hostVisitCount || 1)
      );
      bmitems.weightVisits = bmitems.weightVisits
        ? bmitems.weightVisits * 1
        : 1 + (c.weightVisits || 0);
      bmitems.weightVisitsRadius = computeWeightVisitsRadius(
        bmitems.weightVisits
      );
      bmitems.nodes.push(nodesList.length);
      bookmarkList.set(host, bmitems);
    } else {
      c.hostVisitCount = c.visitCount || 1;
      c.weightVisits = computeWeightVisits(c.hostVisitCount);
      c.weightVisitsRadius = computeWeightVisitsRadius(c.weightVisits);
      bookmarkList.set(host, {
        nodes: [nodesList.length],
        hostVisitCount: c.hostVisitCount,
        weightVisits: c.weightVisits,
        weightVisitsRadius: c.weightVisitsRadius,
        hostLastVisitTime: visitTs,
        host,
      });
    }
    nodesList.push(c);
  }

  return { bookmarkList, nodesList, maxVisits };
}

const UNFOLD_PAGE_SIZE = 24;

export function getUnfoldSlice(
  indexes: number[],
  visibleCount: number
): { visible: number[]; hasMore: boolean; nextCount: number } {
  const nextCount = Math.min(indexes.length, visibleCount);
  return {
    visible: indexes.slice(0, nextCount),
    hasMore: nextCount < indexes.length,
    nextCount: Math.min(indexes.length, nextCount + UNFOLD_PAGE_SIZE),
  };
}

export { UNFOLD_PAGE_SIZE };

type FaviconJob = {
  /** Ключ кэша: host или pageKey */
  cacheKey: string;
  /** Полный URL страницы (для Chrome pageUrl / origin) */
  url: string;
  /** true — сначала _favicon с полным URL (Docs/Notion) */
  pageSpecific: boolean;
  resolve: (data: string | undefined) => void;
};

const faviconQueue: FaviconJob[] = [];
let faviconActive = 0;
const FAVICON_CONCURRENCY = 3;
/** Маркер «хост мёртв / нет иконки» — не долбить сеть снова */
export const FAVICON_MISS = "__miss__";
/** Prefixed localStorage: host → favicon_${host}; page → favicon_page_${pageKey} */
export const FAVICON_PAGE_LS_PREFIX = "favicon_page_";
/** In-flight по cacheKey — не ставить одну и ту же очередь дважды */
const faviconInflight = new Map<string, Promise<string | undefined>>();

/**
 * Ключ page-level: hostname + pathname без query/hash.
 * Docs document vs sheet vs Notion page — разные path → разные иконки.
 */
export function faviconPageKey(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    if (!u.hostname) return null;
    // Убираем хвостовой / — /d/xxx и /d/xxx/ один ключ
    const path = u.pathname.replace(/\/$/, "") || "";
    return u.hostname + path;
  } catch {
    return null;
  }
}

/**
 * Стоит ли грузить page-favicon отдельно от host:
 * path глубже корня (Docs /d/…, Notion /page, …).
 */
export function wantsPageFavicon(pageUrl: string): boolean {
  try {
    const u = new URL(pageUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    // Корень сайта — достаточно host-favicon
    if (parts.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

function readFaviconCache(key: string, lsPrefix: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(lsPrefix + key);
  } catch {
    return null;
  }
}

function writeFaviconCache(
  key: string,
  lsPrefix: string,
  data: string
): void {
  if (typeof localStorage === "undefined" || !key) return;
  try {
    localStorage.setItem(lsPrefix + key, data);
  } catch {
    /* quota */
  }
}

/**
 * src для <img>: page (если url) → host → globe; miss → следующий уровень.
 */
export function resolveFaviconSrc(
  host: string,
  map: Map<string, string> | undefined,
  globe: string,
  pageUrl?: string
): string {
  // 1) page-level (Docs sheet ≠ Docs doc)
  const pageKey = pageUrl ? faviconPageKey(pageUrl) : null;
  if (pageKey) {
    const fromPage = map?.get(pageKey);
    if (fromPage && fromPage !== FAVICON_MISS) return fromPage;
    const lsPage = readFaviconCache(pageKey, FAVICON_PAGE_LS_PREFIX);
    if (lsPage && lsPage !== FAVICON_MISS) return lsPage;
  }
  // 2) общая subdomain/domain иконка
  const fromHost = map?.get(host);
  if (fromHost && fromHost !== FAVICON_MISS) return fromHost;
  const lsHost = readFaviconCache(host, "favicon_");
  if (lsHost && lsHost !== FAVICON_MISS) return lsHost;
  return globe;
}

/**
 * Chrome MV3 Favicon API:
 * chrome-extension://ID/_favicon/?pageUrl=…&size=…
 * @see https://developer.chrome.com/docs/extensions/how-to/ui/favicons
 */
export function chromeFaviconUrl(
  pageUrl: string,
  size = 64
): string | null {
  try {
    const runtime = (
      globalThis as { chrome?: { runtime?: { getURL?: (p: string) => string } } }
    ).chrome?.runtime;
    if (typeof runtime?.getURL !== "function") return null;
    const url = new URL(runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", String(size));
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Кандидаты favicon по порядку.
 * pageSpecific: Chrome с полным URL первым (иконка документа из кэша браузера),
 * затем host: s2 → ico → Chrome origin → s2.
 */
export function faviconSourceUrls(
  pageUrl: string,
  opts?: { pageSpecific?: boolean }
): string[] {
  let u: URL;
  try {
    u = new URL(pageUrl);
  } catch {
    return [];
  }
  const host = u.hostname;
  const isLocal =
    !host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const list: string[] = [];

  // Page: полный pageUrl в Chrome Favicon API (Docs/Notion/…)
  if (opts?.pageSpecific) {
    const page64 = chromeFaviconUrl(pageUrl, 64);
    if (page64) list.push(page64);
    const page32 = chromeFaviconUrl(pageUrl, 32);
    if (page32) list.push(page32);
  }

  if (!isLocal) {
    // Host: s2 sz=32 (быстрый мелкий; sz=64 тот же растр — не дублируем)
    list.push(
      `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`
    );
    // Host: классический /favicon.ico
    list.push(`${u.origin}/favicon.ico`);
  }

  // Host: Chrome Favicon API по origin (общая иконка домена)
  const chromeUrl = chromeFaviconUrl(`${u.protocol}//${host}/`, 64);
  if (chromeUrl) list.push(chromeUrl);

  // Host: s2 без sz
  if (!isLocal) {
    list.push(
      `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(host)}`
    );
  }
  return list;
}

async function runFaviconJob(
  job: FaviconJob,
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost: string | undefined
): Promise<void> {
  // Перебираем кандидатов по порядку, пока не получим data URL
  for (const src of faviconSourceUrls(job.url, {
    pageSpecific: job.pageSpecific,
  })) {
    const data = await toDataURL(src);
    if (data && data.length && data !== faviconLocalhost) {
      job.resolve(data);
      return;
    }
  }
  job.resolve(undefined);
}

function pumpFaviconQueue(
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost: string | undefined
) {
  while (faviconActive < FAVICON_CONCURRENCY && faviconQueue.length > 0) {
    const job = faviconQueue.shift();
    if (!job) break;
    faviconActive++;
    runFaviconJob(job, toDataURL, faviconLocalhost).finally(() => {
      faviconActive--;
      pumpFaviconQueue(toDataURL, faviconLocalhost);
    });
  }
}

/** Запомнить miss, чтобы не ретраить мёртвый host. */
export function markFaviconMiss(host: string): void {
  writeFaviconCache(host, "favicon_", FAVICON_MISS);
}

/**
 * Host-favicon: общая иконка домена (без pageUrl-специфики в кэше).
 */
export function enqueueFavicon(
  url: string,
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost?: string
): Promise<string | undefined> {
  let host: string;
  try {
    host = getHostFromUrl(url);
  } catch {
    return Promise.resolve(undefined);
  }

  const cached = readFaviconCache(host, "favicon_");
  // Miss — сразу Globe, без сети
  if (cached === FAVICON_MISS) {
    return Promise.resolve(undefined);
  }
  if (cached?.length) {
    return Promise.resolve(cached);
  }

  // Уже в полёте — один промис на host
  const pending = faviconInflight.get(host);
  if (pending) return pending;

  const promise = new Promise<string | undefined>((resolve) => {
    faviconQueue.push({
      cacheKey: host,
      url,
      pageSpecific: false,
      resolve,
    });
    pumpFaviconQueue(toDataURL, faviconLocalhost);
  }).then((data) => {
    faviconInflight.delete(host);
    writeFaviconCache(host, "favicon_", data || FAVICON_MISS);
    return data;
  });
  faviconInflight.set(host, promise);
  return promise;
}

/**
 * Page-favicon: иконка конкретной ссылки (Docs/Notion), ключ = host+path.
 * Miss не блокирует host-fallback в resolveFaviconSrc.
 */
export function enqueuePageFavicon(
  url: string,
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost?: string
): Promise<string | undefined> {
  const pageKey = faviconPageKey(url);
  if (!pageKey || !wantsPageFavicon(url)) {
    return Promise.resolve(undefined);
  }

  const cached = readFaviconCache(pageKey, FAVICON_PAGE_LS_PREFIX);
  if (cached === FAVICON_MISS) {
    return Promise.resolve(undefined);
  }
  if (cached?.length) {
    return Promise.resolve(cached);
  }

  const pending = faviconInflight.get("page:" + pageKey);
  if (pending) return pending;

  const promise = new Promise<string | undefined>((resolve) => {
    faviconQueue.push({
      cacheKey: pageKey,
      url,
      pageSpecific: true,
      resolve,
    });
    pumpFaviconQueue(toDataURL, faviconLocalhost);
  }).then((data) => {
    faviconInflight.delete("page:" + pageKey);
    // Miss page — пишем маркер, чтобы не долбить; resolve всё ещё возьмёт host
    writeFaviconCache(pageKey, FAVICON_PAGE_LS_PREFIX, data || FAVICON_MISS);
    return data;
  });
  faviconInflight.set("page:" + pageKey, promise);
  return promise;
}

/** Clear pending favicon jobs (for tests). */
export function clearFaviconQueue(): void {
  faviconQueue.length = 0;
  faviconActive = 0;
  faviconInflight.clear();
}
