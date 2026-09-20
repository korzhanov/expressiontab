/** Демо-данные для preview в обычном браузере (CursorBrowser / localhost). */

export type MockHistoryItem = {
  id: string;
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
};

export type MockBookmark = {
  id: string;
  url: string;
  title: string;
  dateAdded: number;
};

const now = Date.now();
const day = 86400000;
/** 12 недель — горизонт bulk-истории для пресета «12 weeks». */
export const MOCK_HISTORY_WEEKS = 12;
/** Сколько дополнительных URL поверх curated-списка. */
export const MOCK_BULK_HISTORY_COUNT = 1800;

/** Реалистичные хосты + пути — разнообразие пузырей в preview. */
const HOST_POOL = [
  "github.com",
  "gitlab.com",
  "stackoverflow.com",
  "developer.mozilla.org",
  "news.ycombinator.com",
  "reddit.com",
  "medium.com",
  "dev.to",
  "npmjs.com",
  "crates.io",
  "bun.sh",
  "vitejs.dev",
  "svelte.dev",
  "typescriptlang.org",
  "web.dev",
  "css-tricks.com",
  "smashingmagazine.com",
  "figma.com",
  "notion.so",
  "linear.app",
  "vercel.com",
  "netlify.com",
  "cloudflare.com",
  "aws.amazon.com",
  "console.cloud.google.com",
  "azure.microsoft.com",
  "docker.com",
  "kubernetes.io",
  "wikipedia.org",
  "bbc.com",
  "nytimes.com",
  "theguardian.com",
  "youtube.com",
  "vimeo.com",
  "spotify.com",
  "twitch.tv",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "mastodon.social",
  "producthunt.com",
  "dribbble.com",
  "behance.net",
  "unsplash.com",
  "pexels.com",
  "openai.com",
  "anthropic.com",
  "huggingface.co",
];

const PATH_POOL = [
  "",
  "/docs",
  "/blog",
  "/guide",
  "/api",
  "/issues",
  "/pulls",
  "/settings",
  "/search",
  "/explore",
  "/pricing",
  "/about",
  "/changelog",
  "/tutorials",
  "/examples",
  "/reference",
  "/faq",
  "/support",
  "/download",
  "/login",
];

/**
 * Сгенерировать bulk history: count URL, lastVisitTime равномерно по weeks.
 * Детерминированно (без Math.random) — стабильные тесты/snapshot.
 */
export function buildBulkMockHistory({
  count = MOCK_BULK_HISTORY_COUNT,
  weeks = MOCK_HISTORY_WEEKS,
  nowMs = now,
  idOffset = 100,
}: {
  count?: number;
  weeks?: number;
  nowMs?: number;
  idOffset?: number;
} = {}): MockHistoryItem[] {
  const span = weeks * 7 * day;
  const items: MockHistoryItem[] = [];
  for (let i = 0; i < count; i++) {
    // Часть — известные хосты, часть — siteN.example (больше уникальных пузырей)
    const useSynth = i % 3 === 0;
    const host = useSynth
      ? `site${(i % 420) + 1}.example`
      : HOST_POOL[i % HOST_POOL.length];
    const path = PATH_POOL[i % PATH_POOL.length];
    // Равномерно по горизонту weeks + суточный джиттер (детерминированно)
    const age =
      Math.floor((i / Math.max(count, 1)) * span) + ((i * 9973) % day);
    const visitCount = 1 + ((i * 17) % 180);
    items.push({
      id: String(idOffset + i),
      url: `https://${host}${path}${path ? `?i=${i}` : `/page/${i}`}`,
      title: useSynth
        ? `Site ${(i % 420) + 1} · ${path || "home"} #${i}`
        : `${host}${path || "/"} · visit ${i}`,
      visitCount,
      lastVisitTime: nowMs - age,
    });
  }
  return items;
}

/** Фильтр chrome.history.search по startTime/endTime (ms). */
export function filterByVisitTime(
  items: MockHistoryItem[],
  startTime?: number,
  endTime?: number
): MockHistoryItem[] {
  const start = startTime ?? 0;
  const end = endTime ?? Number.POSITIVE_INFINITY;
  return items.filter(
    (i) => i.lastVisitTime >= start && i.lastVisitTime <= end
  );
}

export const MOCK_HISTORY_CURATED: MockHistoryItem[] = [
  {
    id: "1",
    url: "https://github.com/korzhanov/expressiontab",
    title: "expressiontab — GitHub",
    visitCount: 42,
    lastVisitTime: now - day,
  },
  {
    id: "2",
    url: "https://developer.chrome.com/docs/extensions",
    title: "Chrome Extensions docs",
    visitCount: 18,
    lastVisitTime: now - 2 * day,
  },
  {
    id: "3",
    url: "https://svelte.dev/docs",
    title: "Svelte • Docs",
    visitCount: 55,
    lastVisitTime: now - 3 * day,
  },
  {
    id: "4",
    url: "https://news.ycombinator.com/",
    title: "Hacker News",
    visitCount: 120,
    lastVisitTime: now - day / 2,
  },
  {
    id: "5",
    url: "https://www.wikipedia.org/",
    title: "Wikipedia",
    visitCount: 33,
    lastVisitTime: now - 4 * day,
  },
  {
    id: "6",
    url: "https://stackoverflow.com/questions",
    title: "Stack Overflow",
    visitCount: 90,
    lastVisitTime: now - 5 * day,
  },
  {
    id: "7",
    url: "https://www.youtube.com/",
    title: "YouTube",
    visitCount: 200,
    lastVisitTime: now - day / 3,
  },
  {
    id: "8",
    url: "https://twitter.com/",
    title: "Twitter / X",
    visitCount: 70,
    lastVisitTime: now - 6 * day,
  },
  {
    id: "9",
    url: "https://www.instagram.com/",
    title: "Instagram",
    visitCount: 40,
    lastVisitTime: now - 2 * day,
  },
  {
    id: "10",
    url: "https://vitejs.dev/",
    title: "Vite",
    visitCount: 25,
    lastVisitTime: now - day,
  },
];

/** Curated + 1800 bulk за 12 недель. */
export const MOCK_HISTORY: MockHistoryItem[] = [
  ...MOCK_HISTORY_CURATED,
  ...buildBulkMockHistory({
    count: MOCK_BULK_HISTORY_COUNT,
    weeks: MOCK_HISTORY_WEEKS,
    nowMs: now,
    idOffset: 100,
  }),
];

/** Открытые вкладки для preview: окно 1 = current, окно 2 = другое. */
export type MockOpenTab = {
  id: number;
  url: string;
  title: string;
  windowId: number;
  pinned?: boolean;
  active?: boolean;
};

export const MOCK_OPEN_TABS: MockOpenTab[] = [
  {
    id: 1,
    url: "http://localhost:4173/newtab/",
    title: "Xpression Tab",
    windowId: 1,
    active: true,
  },
  {
    id: 2,
    url: "https://example.org/inbox",
    title: "Inbox — example.org",
    windowId: 1,
  },
  {
    id: 3,
    url: "https://example.org/settings",
    title: "Settings — example.org",
    windowId: 1,
    pinned: true,
  },
  {
    id: 4,
    url: "https://example.net/other-window",
    title: "Other window",
    windowId: 2,
  },
];

export const MOCK_BOOKMARKS: MockBookmark[] = [
  {
    id: "b1",
    url: "https://github.com/korzhanov/expressiontab",
    title: "ExpressionTab ★",
    dateAdded: now - 10 * day,
  },
  {
    id: "b2",
    url: "https://svelte.dev/",
    title: "Svelte",
    dateAdded: now - 20 * day,
  },
  {
    id: "b3",
    url: "https://bun.sh/",
    title: "Bun",
    dateAdded: now - 15 * day,
  },
];

export function filterByText<T extends { url?: string; title?: string }>(
  items: T[],
  text: string
): T[] {
  const q = (text || "").trim().toLowerCase();
  if (!q || q === "h") return items;
  return items.filter(
    (i) =>
      (i.title || "").toLowerCase().includes(q) ||
      (i.url || "").toLowerCase().includes(q)
  );
}
