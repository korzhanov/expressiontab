/** Форматирование возраста визита/закладки для тултипов dial */

export const STALE_VISIT_DAYS = 90;
export const OLD_BOOKMARK_DAYS = 180;
export const LONG_OPEN_HOURS = 8;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Короткая дата для тултипа */
export function formatDateShort(
  ts: number,
  locale?: string
): string {
  if (!ts || ts <= 0) return "";
  return new Date(ts).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Визит старше порога — «давно» */
export function isStaleVisit(
  lastVisitTime: number | undefined | null,
  now = Date.now(),
  days = STALE_VISIT_DAYS
): boolean {
  if (lastVisitTime == null || lastVisitTime <= 0) return false;
  return now - lastVisitTime >= days * DAY_MS;
}

/** Закладка создана давно */
export function isOldBookmark(
  dateAdded: number | undefined | null,
  now = Date.now(),
  days = OLD_BOOKMARK_DAYS
): boolean {
  if (dateAdded == null || dateAdded <= 0) return false;
  return now - dateAdded >= days * DAY_MS;
}

/** Вкладка (session) открыта очень долго */
export function isLongOpen(
  openedAt: number | undefined | null,
  now = Date.now(),
  hours = LONG_OPEN_HOURS
): boolean {
  if (openedAt == null || openedAt <= 0) return false;
  return now - openedAt >= hours * HOUR_MS;
}

/** Человекочитаемая длительность «открыта N» */
export function formatOpenDuration(
  openedAt: number,
  now = Date.now()
): string {
  if (!openedAt || openedAt <= 0) return "";
  const ms = Math.max(0, now - openedAt);
  const hours = Math.floor(ms / HOUR_MS);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60000));
    return `Open for ${mins}m`;
  }
  if (hours < 48) return `Open for ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Open for ${days}d`;
}

export type AnchorTooltipInput = {
  title?: string;
  /** Полный URL — как в bubble tip */
  url?: string;
  visitCount?: number;
  lastVisitTime?: number | null;
  dateAdded?: number | null;
  isBookmark?: boolean;
  isSession?: boolean;
  /** Session: когда вкладка попала в dial (ms) */
  openedAt?: number | null;
  now?: number;
};

export type AnchorTooltipResult = {
  text: string;
  staleVisit: boolean;
  oldBookmark: boolean;
  longOpen: boolean;
  /** Любой сигнал «давно» — для CSS-класса */
  aged: boolean;
};

/** Единый текст тултипа bubble/lined: title · url · visits · dates */
export function buildAnchorTooltip(input: AnchorTooltipInput): AnchorTooltipResult {
  const now = input.now ?? Date.now();
  const parts: string[] = [];
  if (input.title) parts.push(input.title);
  // Ссылка отдельной строкой смысла, если не совпадает с title
  if (input.url && input.url !== input.title) parts.push(input.url);

  const visits = input.visitCount ?? 0;
  if (visits > 0 && !input.isSession) {
    parts.push(`${visits} visit${visits === 1 ? "" : "s"}`);
  }

  const staleVisit = isStaleVisit(input.lastVisitTime, now);
  const oldBookmark = !!(input.isBookmark && isOldBookmark(input.dateAdded, now));
  const openedAt = input.isSession
    ? input.openedAt ?? input.lastVisitTime
    : null;
  const longOpen = !!(input.isSession && isLongOpen(openedAt, now));

  if (input.isSession && openedAt) {
    const dur = formatOpenDuration(openedAt, now);
    if (dur) parts.push(longOpen ? `${dur} (long)` : dur);
  } else if (input.lastVisitTime && input.lastVisitTime > 0) {
    const d = formatDateShort(input.lastVisitTime);
    if (d) parts.push(staleVisit ? `Last visit: ${d} (long ago)` : `Last visit: ${d}`);
  }

  if (input.isBookmark && input.dateAdded && input.dateAdded > 0) {
    const d = formatDateShort(input.dateAdded);
    if (d) parts.push(oldBookmark ? `Added: ${d} (old)` : `Added: ${d}`);
  }

  return {
    text: parts.filter(Boolean).join(" · "),
    staleVisit,
    oldBookmark,
    longOpen,
    aged: staleVisit || oldBookmark || longOpen,
  };
}
