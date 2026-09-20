/**
 * Ленивая подгрузка иконок: только для видимых пузырей/рядов,
 * через idle-очередь (не blast на весь dial при getBookmarks).
 */
import {
  enqueueFavicon,
  enqueuePageFavicon,
  faviconPageKey,
  getHostFromUrl,
  wantsPageFavicon,
} from "./bookmarks";
import { enqueueCover, shouldLoadCover } from "./cover-icons";
import { covers, favicons, tipImages } from "./stores";
import { toDataURL } from "./utils";

/** localhost-favicon data URL — отсечка «пустых» иконок */
let faviconLocalhost: string | undefined;

/** Уже запросили в этой сессии (кроме inflight внутри enqueue) */
const asked = new Set<string>();

/** Вызвать из Anchores после подготовки favicon_localhost */
export function configureIconLoader(opts: {
  faviconLocalhost?: string;
}): void {
  if (opts.faviconLocalhost != null) {
    faviconLocalhost = opts.faviconLocalhost;
  }
}

/** Сброс asked (тесты / новая выдача history) */
export function resetIconEnsure(): void {
  asked.clear();
}

/**
 * Host + page favicon + cover по мере надобности для одного видимого узла.
 * skipCover — lined list: cover не нужен, только грузит HTML.
 */
export function ensureIconsForAnchor({
  url,
  radius,
  isBookmark,
  skipCover = false,
}: {
  url: string;
  radius?: number;
  isBookmark?: boolean;
  skipCover?: boolean;
}): void {
  if (!url) return;
  let host: string;
  try {
    host = getHostFromUrl(url);
  } catch {
    return;
  }

  // 1) Общая иконка домена
  const hostKey = "h:" + host;
  if (!asked.has(hostKey)) {
    asked.add(hostKey);
    enqueueFavicon(url, toDataURL, faviconLocalhost).then((data) => {
      if (!data) return;
      favicons.update((map) => {
        map.set(host, data);
        return map;
      });
    });
  }

  // 2) Page-level (Docs/Notion) — только если path глубже корня
  if (wantsPageFavicon(url)) {
    const pk = faviconPageKey(url);
    const pageAsk = pk ? "p:" + pk : "p:" + url;
    if (!asked.has(pageAsk)) {
      asked.add(pageAsk);
      enqueuePageFavicon(url, toDataURL, faviconLocalhost).then((data) => {
        if (!data || !pk) return;
        favicons.update((map) => {
          map.set(pk, data);
          return map;
        });
      });
    }
  }

  // 3) Cover/tip — bubble only (lined не показывает cover-фон)
  if (
    !skipCover &&
    shouldLoadCover({
      radius: radius ?? 40,
      isBookmark: !!isBookmark,
    })
  ) {
    const coverKey = "c:" + host;
    if (!asked.has(coverKey)) {
      asked.add(coverKey);
      enqueueCover(url, toDataURL).then((result) => {
        if (result.cover) {
          covers.update((map) => {
            map.set(host, result.cover!);
            return map;
          });
        }
        if (result.tip) {
          tipImages.update((map) => {
            map.set(host, result.tip!);
            return map;
          });
        }
      });
    }
  }
}
