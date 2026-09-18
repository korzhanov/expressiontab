import { ignoreUrl } from "./utils";

export type HostGroup = {
  nodes: number[];
  hostVisitCount?: number;
  weightVisits?: number;
  weightVisitsRadius?: number;
  host?: string;
  /** Максимальный lastVisitTime среди URL хоста */
  hostLastVisitTime?: number;
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
  [key: string]: unknown;
};

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
      group.weightVisitsRadius * 2 ||
      firstNode?.weightVisitsRadius * 2 ||
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
  host: string;
  url: string;
  resolve: (data: string | undefined) => void;
};

const faviconQueue: FaviconJob[] = [];
let faviconActive = 0;
const FAVICON_CONCURRENCY = 3;

/** URL-кандидаты favicon: s2 с sz, /favicon.ico, базовый s2. */
export function faviconSourceUrls(pageUrl: string): string[] {
  let origin = "";
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return [];
  }
  const enc = encodeURIComponent(pageUrl);
  const list = [
    `https://s2.googleusercontent.com/s2/favicons?domain_url=${enc}&sz=64`,
    `https://s2.googleusercontent.com/s2/favicons?domain_url=${enc}&sz=32`,
    `${origin}/favicon.ico`,
    `https://s2.googleusercontent.com/s2/favicons?domain_url=${enc}`,
  ];
  return list;
}

/** Lazy: link[rel~=icon] и manifest icons (только в расширении с host access). */
async function discoverFaviconUrls(pageUrl: string): Promise<string[]> {
  const found: string[] = [];
  try {
    const res = await fetch(pageUrl, { credentials: "omit" });
    if (!res.ok) return found;
    const html = await res.text();
    const linkRe =
      /<link[^>]+rel=["']([^"']*)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html))) {
      const rel = m[1].toLowerCase();
      if (!rel.includes("icon")) continue;
      try {
        found.push(new URL(m[2], pageUrl).href);
      } catch {
        /* skip */
      }
    }
    const manifestMatch = html.match(
      /<link[^>]+rel=["']manifest["'][^>]*href=["']([^"']+)["']/i
    );
    if (manifestMatch?.[1]) {
      try {
        const manifestUrl = new URL(manifestMatch[1], pageUrl).href;
        const mr = await fetch(manifestUrl, { credentials: "omit" });
        if (mr.ok) {
          const manifest = (await mr.json()) as {
            icons?: { src?: string }[];
          };
          for (const ic of manifest.icons || []) {
            if (ic.src) found.push(new URL(ic.src, manifestUrl).href);
          }
        }
      } catch {
        /* CORS / parse */
      }
    }
  } catch {
    /* preview CORS — fallback на s2 */
  }
  return found;
}

async function runFaviconJob(
  job: FaviconJob,
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost: string | undefined
): Promise<void> {
  const sources = [
    ...faviconSourceUrls(job.url),
    ...(await discoverFaviconUrls(job.url)),
  ];
  const seen = new Set<string>();
  for (const src of sources) {
    if (seen.has(src)) continue;
    seen.add(src);
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

/** Enqueue a single favicon fetch with concurrency limit. */
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

  const cached =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("favicon_" + host)
      : null;
  if (cached?.length) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    faviconQueue.push({ host, url, resolve });
    pumpFaviconQueue(toDataURL, faviconLocalhost);
  }).then((data: string | undefined) => {
    if (data && typeof localStorage !== "undefined") {
      localStorage.setItem("favicon_" + host, data);
    }
    return data;
  });
}

/** Clear pending favicon jobs (for tests). */
export function clearFaviconQueue(): void {
  faviconQueue.length = 0;
  faviconActive = 0;
}
