import { ignoreUrl } from "./utils";

export type HostGroup = {
  nodes: number[];
  hostVisitCount?: number;
  weightVisits?: number;
  weightVisitsRadius?: number;
  host?: string;
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
  if (!url) return true;
  return ignoreUrl.some((prefix) => url.startsWith(prefix));
}

export function getHostFromUrl(url: string): string {
  return new URL(url).host.split(":")[0] || "localhost";
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

    if (bookmarkList.has(host)) {
      const bmitems = bookmarkList.get(host) as HostGroup;
      bmitems.hostVisitCount =
        (bmitems.hostVisitCount ? bmitems.hostVisitCount * 1 : 1) +
        (c.visitCount || 1);
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

async function runFaviconJob(
  job: FaviconJob,
  toDataURL: (url: string) => Promise<string | undefined>,
  faviconLocalhost: string | undefined
): Promise<void> {
  const sources = [
    "https://s2.googleusercontent.com/s2/favicons?domain_url=" +
      encodeURIComponent(job.url),
  ];
  for (const src of sources) {
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
