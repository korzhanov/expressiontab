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

export const MOCK_HISTORY: MockHistoryItem[] = [
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
