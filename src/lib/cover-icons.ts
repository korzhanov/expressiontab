/**
 * Крупные иконки для фона больших / starred-пузырей.
 * Без Chrome _favicon / обычных favicon (пикселятся).
 * Порядок: speculative manifest → HTML rel=manifest → apple/og;
 * twitter:image — только для тултипа (не cover).
 * SVG допустимы даже без большого sizes.
 * Ошибки → catch / null (Chrome Network 404 всё равно может писать).
 */
import { FAVICON_MISS, getHostFromUrl } from "./bookmarks";
import { scheduleIdle } from "./idle-schedule";

/** Маркер miss в localStorage */
export const COVER_MISS = "__miss__";
/** Диаметр пузыря, с которого имеет смысл cover-фон */
export const COVER_MIN_SIZE = 96;

/** Speculative paths web app manifest */
export const MANIFEST_PATHS = [
  "/manifest.json",
  "/site.webmanifest",
  "/manifest.webmanifest",
] as const;

/** Результат загрузки: cover для шара, tip — twitter (тултип) */
export type CoverLoadResult = {
  cover?: string;
  tip?: string;
};

type CoverJob = {
  host: string;
  url: string;
  resolve: (data: CoverLoadResult) => void;
};

const queue: CoverJob[] = [];
let active = 0;
/** 1 + idle: HTML/manifest parse тяжёлый для main thread */
const CONCURRENCY = 1;
const inflight = new Map<string, Promise<CoverLoadResult>>();
/** Session: URL уже 404 / пустой — не долбить снова */
const probeMiss = new Set<string>();

/** Абсолютный URL из href/content относительно страницы. */
export function absolutizeUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Cover не берём из пиксельных favicon-сервисов / .ico.
 * SVG и apple/og/manifest large — ок.
 */
export function isCoverWorthyUrl(href: string): boolean {
  const u = (href || "").toLowerCase();
  if (!u) return false;
  // SVG — вектор, на большом пузыре не пикселится
  if (
    u.includes(".svg") ||
    u.includes("image/svg") ||
    u.includes("format=svg")
  ) {
    return true;
  }
  // Chrome Favicon API / Google s2 / gstatic — мелкий растр
  if (u.includes("/_favicon/")) return false;
  if (u.includes("s2.googleusercontent.com/s2/favicons")) return false;
  if (u.includes("gstatic.com/favicon")) return false;
  if (u.includes("favicon.ico")) return false;
  if (/\/favicon(\?|$)/.test(u)) return false;
  return true;
}

/**
 * Host + родительский (для тестов / будущих эвристик).
 * Speculative probe parent не используем — лишние 404.
 */
export function coverOriginHosts(hostname: string): string[] {
  const h = (hostname || "").toLowerCase().replace(/\.$/, "");
  if (!h || h === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return [];
  const out: string[] = [h];
  const parts = h.split(".");
  if (parts.length > 2) {
    const parent = parts.slice(1).join(".");
    if (parent.includes(".") && !out.includes(parent)) out.push(parent);
  }
  return out;
}

/**
 * Speculative URL манифестов: host, затем parent × paths.
 * 404 глотаем в xhr (null) — без throw.
 */
export function manifestCandidateUrls(pageUrl: string): string[] {
  try {
    const u = new URL(pageUrl);
    const urls: string[] = [];
    for (const host of coverOriginHosts(u.hostname)) {
      const origin = `${u.protocol}//${host}`;
      for (const path of MANIFEST_PATHS) {
        urls.push(origin + path);
      }
    }
    return urls;
  } catch {
    return [];
  }
}

/** link rel=manifest из HTML — точный URL без угадывания path. */
export function parseManifestLink(
  html: string,
  pageUrl: string
): string | null {
  const re = /<link[^>]+rel=["']([^"']*manifest[^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const abs = href ? absolutizeUrl(href, pageUrl) : null;
    if (abs && /^https?:/i.test(abs)) return abs;
  }
  const re2 =
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']([^"']*manifest[^"']*)["'][^>]*>/gi;
  while ((m = re2.exec(html))) {
    const abs = absolutizeUrl(m[1], pageUrl);
    if (abs && /^https?:/i.test(abs)) return abs;
  }
  return null;
}

type Scored = { href: string; score: number };

function pushScored(
  scored: Scored[],
  seen: Set<string>,
  href: string | null | undefined,
  baseUrl: string,
  score: number
) {
  if (!href) return;
  const abs = absolutizeUrl(href.trim(), baseUrl);
  if (!abs || seen.has(abs)) return;
  if (!/^https?:/i.test(abs)) return;
  // Пиксельные favicon в cover не пускаем
  if (!isCoverWorthyUrl(abs)) return;
  seen.add(abs);
  scored.push({ href: abs, score });
}

/** Иконки из Web App Manifest JSON (icons[]). */
export function parseManifestIcons(
  manifest: unknown,
  baseUrl: string
): string[] {
  const scored: Scored[] = [];
  const seen = new Set<string>();
  const icons = (manifest as { icons?: unknown })?.icons;
  if (!Array.isArray(icons)) return [];
  for (const raw of icons) {
    const ic = raw as {
      src?: string;
      sizes?: string;
      purpose?: string;
      type?: string;
    };
    if (!ic?.src) continue;
    const sizes = ic.sizes || "";
    const dim = Math.max(
      0,
      ...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0)
    );
    const isSvg =
      /\.svg(\?|$)/i.test(ic.src) ||
      (ic.type || "").toLowerCase().includes("svg");
    const effective = dim > 0 ? dim : isSvg ? 512 : 192;
    // Мелкий растр без SVG — skip
    if (effective < 128 && dim > 0 && !isSvg) continue;
    const purpose = (ic.purpose || "any").toLowerCase();
    const purposeBoost = purpose.includes("monochrome") ? -40 : 0;
    const svgBoost = isSvg ? 80 : 0;
    pushScored(
      scored,
      seen,
      ic.src,
      baseUrl,
      300 + Math.min(effective, 512) + purposeBoost + svgBoost
    );
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.href);
}

/**
 * Достаёт кандидатов cover из HTML: apple-touch → large icon → og.
 * twitter:image сюда не входит — только parseTipImageUrls.
 */
export function parseCoverIconUrls(html: string, pageUrl: string): string[] {
  const scored: Scored[] = [];
  const seen = new Set<string>();

  const push = (href: string | null | undefined, score: number) => {
    pushScored(scored, seen, href, pageUrl, score);
  };

  const appleRe =
    /<link[^>]+rel=["']([^"']*apple-touch-icon[^"']*)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = appleRe.exec(html))) {
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1] || "";
    const dim = Math.max(
      0,
      ...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0)
    );
    push(href, 200 + Math.min(dim, 512));
  }

  const iconRe = /<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]*>/gi;
  while ((m = iconRe.exec(html))) {
    const rel = (m[1] || "").toLowerCase();
    if (rel.includes("apple-touch") || rel.includes("manifest")) continue;
    const tag = m[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1] || "";
    const dim = Math.max(
      0,
      ...sizes.split(/\s+/).map((s) => parseInt(s, 10) || 0)
    );
    if (dim >= 128) push(href, 120 + Math.min(dim, 512));
  }

  const metaRe =
    /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  while ((m = metaRe.exec(html))) {
    const key = m[1].toLowerCase();
    const content = m[2];
    // og — cover; twitter — только tip
    if (key === "og:image" || key === "og:image:url") push(content, 80);
  }
  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']([^"']+)["'][^>]*>/gi;
  while ((m = metaRe2.exec(html))) {
    const content = m[1];
    const key = m[2].toLowerCase();
    if (key === "og:image" || key === "og:image:url") push(content, 80);
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.href);
}

/**
 * twitter:image для тултипа (не для фона пузыря).
 */
export function parseTipImageUrls(html: string, pageUrl: string): string[] {
  const scored: Scored[] = [];
  const seen = new Set<string>();
  const push = (href: string | null | undefined, score: number) => {
    pushScored(scored, seen, href, pageUrl, score);
  };

  const metaRe =
    /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html))) {
    const key = m[1].toLowerCase();
    if (key === "twitter:image" || key === "twitter:image:src")
      push(m[2], 100);
  }
  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']([^"']+)["'][^>]*>/gi;
  while ((m = metaRe2.exec(html))) {
    const key = m[2].toLowerCase();
    if (key === "twitter:image" || key === "twitter:image:src")
      push(m[1], 100);
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.href);
}

/** src для фона: map / localStorage / fallback. */
export function resolveCoverSrc(
  host: string,
  map: Map<string, string> | undefined,
  fallback: string
): string {
  const fromMap = map?.get(host);
  if (fromMap && fromMap !== COVER_MISS) return fromMap;
  if (typeof localStorage !== "undefined") {
    const cached = localStorage.getItem("cover_" + host);
    if (cached && cached !== COVER_MISS) return cached;
  }
  return fallback;
}

/**
 * Превью тултипа: tip (twitter) → иначе cover → fallback.
 */
export function resolveTipImageSrc(
  host: string,
  tipMap: Map<string, string> | undefined,
  coverMap: Map<string, string> | undefined,
  fallback: string
): string {
  const fromTip = tipMap?.get(host);
  if (fromTip && fromTip !== COVER_MISS) return fromTip;
  if (typeof localStorage !== "undefined") {
    const cached = localStorage.getItem("tip_" + host);
    if (cached && cached !== COVER_MISS) return cached;
  }
  return resolveCoverSrc(host, coverMap, fallback);
}

/**
 * Текст по URL через XHR. Ошибки/4xx/timeout → null (не throw).
 * XHR вместо fetch — меньше Early Hints/preload в консоли.
 */
function xhrText(url: string, maxBytes: number): Promise<string | null> {
  if (probeMiss.has(url)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 4000;
      xhr.open("GET", url, true);
      xhr.responseType = "text";
      xhr.onload = () => {
        try {
          if (xhr.status < 200 || xhr.status >= 300) {
            probeMiss.add(url);
            resolve(null);
            return;
          }
          resolve(String(xhr.responseText || "").slice(0, maxBytes));
        } catch {
          probeMiss.add(url);
          resolve(null);
        }
      };
      xhr.onerror = () => {
        probeMiss.add(url);
        resolve(null);
      };
      xhr.ontimeout = () => {
        probeMiss.add(url);
        resolve(null);
      };
      xhr.send();
    } catch {
      probeMiss.add(url);
      resolve(null);
    }
  });
}

/** Скачать и распарсить manifest; ошибки → []. */
export async function fetchManifestIconUrls(
  manifestUrl: string
): Promise<string[]> {
  try {
    const text = await xhrText(manifestUrl, 64_000);
    if (!text) return [];
    const json = JSON.parse(text) as unknown;
    return parseManifestIcons(json, manifestUrl);
  } catch {
    probeMiss.add(manifestUrl);
    return [];
  }
}

async function tryIconUrls(
  candidates: string[],
  toDataURL: (url: string) => Promise<string | undefined>,
  limit = 4
): Promise<string | undefined> {
  const worthy = candidates.filter(isCoverWorthyUrl);
  for (const src of worthy.slice(0, limit)) {
    if (probeMiss.has(src)) continue;
    try {
      const data = await toDataURL(src);
      if (data && data.length > 32) return data;
    } catch {
      /* сеть / CORS — следующий кандидат */
    }
    probeMiss.add(src);
  }
  return undefined;
}

async function runCoverJob(
  job: CoverJob,
  toDataURL: (url: string) => Promise<string | undefined>
): Promise<void> {
  try {
    let cover: string | undefined;
    let tip: string | undefined;

    // 1) Speculative manifest host + parent → только cover
    for (const mUrl of manifestCandidateUrls(job.url)) {
      const icons = await fetchManifestIconUrls(mUrl);
      if (!icons.length) continue;
      const data = await tryIconUrls(icons, toDataURL);
      if (data) {
        cover = data;
        break;
      }
    }

    const origin = (() => {
      try {
        return new URL(job.url).origin + "/";
      } catch {
        return null;
      }
    })();
    if (!origin) {
      job.resolve({ cover, tip });
      return;
    }

    // 2) HTML → tip (twitter) + cover (manifest link / apple / og)
    const html = await xhrText(origin, 120_000);
    if (!html) {
      job.resolve({ cover, tip });
      return;
    }

    // twitter:image — только tip, даже если cover уже из manifest
    const tipUrls = parseTipImageUrls(html, origin);
    if (tipUrls.length) {
      tip = await tryIconUrls(tipUrls, toDataURL, 2);
    }

    if (!cover) {
      const linked = parseManifestLink(html, origin);
      if (linked) {
        const icons = await fetchManifestIconUrls(linked);
        if (icons.length) {
          cover = await tryIconUrls(icons, toDataURL);
        }
      }
    }

    if (!cover) {
      const candidates = parseCoverIconUrls(html, origin);
      cover = await tryIconUrls(candidates, toDataURL);
    }

    job.resolve({ cover, tip });
  } catch {
    // Любая неожиданная ошибка — просто без cover/tip
    job.resolve({});
  }
}

function pump(toDataURL: (url: string) => Promise<string | undefined>) {
  if (active >= CONCURRENCY || queue.length === 0) return;
  scheduleIdle(() => {
    if (active >= CONCURRENCY || queue.length === 0) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    runCoverJob(job, toDataURL).finally(() => {
      active--;
      pump(toDataURL);
    });
  });
}

/** Фоновая очередь cover (+ twitter tip) для крупных / starred хостов. */
export function enqueueCover(
  url: string,
  toDataURL: (url: string) => Promise<string | undefined>
): Promise<CoverLoadResult> {
  let host: string;
  try {
    host = getHostFromUrl(url);
  } catch {
    return Promise.resolve({});
  }
  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem("favicon_" + host) === FAVICON_MISS
    ) {
      return Promise.resolve({});
    }
  } catch {
    /* */
  }

  const cachedCover =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("cover_" + host)
      : null;
  const cachedTip =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("tip_" + host)
      : null;

  // Оба уже в кэше (в т.ч. miss) — без сети
  if (
    cachedCover != null &&
    cachedCover.length > 0 &&
    cachedTip != null &&
    cachedTip.length > 0
  ) {
    return Promise.resolve({
      cover:
        cachedCover !== COVER_MISS && cachedCover.length
          ? cachedCover
          : undefined,
      tip:
        cachedTip !== COVER_MISS && cachedTip.length ? cachedTip : undefined,
    });
  }

  const pending = inflight.get(host);
  if (pending) return pending;

  const promise = new Promise<CoverLoadResult>((resolve) => {
    queue.unshift({ host, url, resolve });
    pump(toDataURL);
  }).then((data) => {
    inflight.delete(host);
    if (typeof localStorage !== "undefined") {
      try {
        // Не затирать хороший кэш пустым miss, если уже был cover
        if (data.cover?.length) {
          localStorage.setItem("cover_" + host, data.cover);
        } else if (cachedCover == null) {
          localStorage.setItem("cover_" + host, COVER_MISS);
        }
        if (data.tip?.length) {
          localStorage.setItem("tip_" + host, data.tip);
        } else if (cachedTip == null) {
          localStorage.setItem("tip_" + host, COVER_MISS);
        }
      } catch {
        /* quota */
      }
    }
    // Подмешать уже закэшированное, если job вернул только одну сторону
    return {
      cover:
        data.cover ||
        (cachedCover && cachedCover !== COVER_MISS ? cachedCover : undefined),
      tip:
        data.tip ||
        (cachedTip && cachedTip !== COVER_MISS ? cachedTip : undefined),
    };
  });
  inflight.set(host, promise);
  return promise;
}

/** Нужен ли cover для пузыря (крупный или закладка). */
export function shouldLoadCover({
  radius,
  isBookmark,
}: {
  radius: number;
  isBookmark?: boolean;
}): boolean {
  if (isBookmark) return true;
  return radius * 2 >= COVER_MIN_SIZE;
}

export function clearCoverQueue(): void {
  queue.length = 0;
  active = 0;
  inflight.clear();
  probeMiss.clear();
}
