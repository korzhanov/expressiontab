/**
 * Бесплатные обои без API-ключей (публичный MV3 — ключ всё равно утечёт).
 * Источники: Peapix Bing/Spotlight, Bing archive, biturl, Picsum.
 */
import { BACKGROUND_MAX_CHARS } from "./background-persist";

export type WallpaperSourceId =
  | "peapix-bing"
  | "peapix-spotlight"
  | "bing-archive"
  | "biturl"
  | "picsum";

export type WallpaperPick = {
  source: WallpaperSourceId;
  /** Прямой https (или picsum redirect) на файл */
  imageUrl: string;
  title?: string;
};

/** Календарный день UTC YYYY-MM-DD */
export function wallpaperDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Стабильный выбор источника на день (ротация по всем) */
export function pickSourceForDay(
  dayKey: string,
  sources: WallpaperSourceId[] = [
    "peapix-bing",
    "peapix-spotlight",
    "bing-archive",
    "biturl",
    "picsum",
  ]
): WallpaperSourceId {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0: иначе отрицательный % в JS → sources[-1] === undefined
  const idx = (h >>> 0) % sources.length;
  return sources[idx];
}

type Json = Record<string, unknown>;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

/** Peapix Bing daily */
export async function resolvePeapixBing(
  country = "us"
): Promise<WallpaperPick> {
  const data = (await fetchJson(
    `https://peapix.com/bing/feed?country=${encodeURIComponent(country)}&n=1`
  )) as Json[];
  const row = Array.isArray(data) ? data[0] : null;
  const imageUrl = String(row?.fullUrl || row?.imageUrl || "");
  if (!imageUrl) throw new Error("peapix-bing: empty");
  return {
    source: "peapix-bing",
    imageUrl,
    title: String(row?.title || ""),
  };
}

/** Peapix Windows Spotlight */
export async function resolvePeapixSpotlight(): Promise<WallpaperPick> {
  const data = (await fetchJson(
    "https://peapix.com/spotlight/feed?n=1"
  )) as Json[];
  const row = Array.isArray(data) ? data[0] : null;
  const imageUrl = String(row?.fullUrl || row?.imageUrl || "");
  if (!imageUrl) throw new Error("peapix-spotlight: empty");
  return {
    source: "peapix-spotlight",
    imageUrl,
    title: String(row?.title || ""),
  };
}

/** Официальный Bing HPImageArchive (без ключа) */
export async function resolveBingArchive(mkt = "en-US"): Promise<WallpaperPick> {
  const data = (await fetchJson(
    `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${encodeURIComponent(mkt)}`
  )) as { images?: { url?: string; title?: string; copyright?: string }[] };
  const img = data?.images?.[0];
  const path = img?.url || "";
  if (!path) throw new Error("bing-archive: empty");
  const imageUrl = path.startsWith("http")
    ? path
    : `https://www.bing.com${path}`;
  return {
    source: "bing-archive",
    imageUrl,
    title: String(img?.title || img?.copyright || ""),
  };
}

/** Зеркало Bing JSON */
export async function resolveBiturl(mkt = "en-US"): Promise<WallpaperPick> {
  const data = (await fetchJson(
    `https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=${encodeURIComponent(mkt)}`
  )) as { url?: string; copyright?: string };
  const imageUrl = String(data?.url || "");
  if (!imageUrl) throw new Error("biturl: empty");
  return {
    source: "biturl",
    imageUrl,
    title: String(data?.copyright || ""),
  };
}

/** Picsum: стабильный seed = dayKey */
export async function resolvePicsum(dayKey: string): Promise<WallpaperPick> {
  return {
    source: "picsum",
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(dayKey)}/1920/1080.jpg`,
    title: `Picsum ${dayKey}`,
  };
}

export async function resolveWallpaperPick(
  source: WallpaperSourceId,
  dayKey: string
): Promise<WallpaperPick> {
  switch (source) {
    case "peapix-bing":
      return resolvePeapixBing();
    case "peapix-spotlight":
      return resolvePeapixSpotlight();
    case "bing-archive":
      return resolveBingArchive();
    case "biturl":
      return resolveBiturl();
    case "picsum":
      return resolvePicsum(dayKey);
    default:
      return resolvePicsum(dayKey);
  }
}

/**
 * Скачать remote image → JPEG data URL (с запасными источниками на день).
 */
export async function fetchDailyWallpaperDataUrl(
  dayKey: string = wallpaperDayKey(),
  {
    prefer,
    maxChars = BACKGROUND_MAX_CHARS,
  }: { prefer?: WallpaperSourceId; maxChars?: number } = {}
): Promise<{ dataUrl: string; source: WallpaperSourceId; title?: string }> {
  const order: WallpaperSourceId[] = [
    prefer || pickSourceForDay(dayKey),
    "peapix-bing",
    "bing-archive",
    "biturl",
    "peapix-spotlight",
    "picsum",
  ];
  // Уникальный порядок
  const seen = new Set<WallpaperSourceId>();
  const unique = order.filter((id) =>
    seen.has(id) ? false : (seen.add(id), true)
  );

  let lastErr: unknown;
  for (const source of unique) {
    try {
      const pick = await resolveWallpaperPick(source, dayKey);
      const dataUrl = await remoteImageToJpegDataUrl(pick.imageUrl, maxChars);
      return { dataUrl, source: pick.source, title: pick.title };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("all wallpaper sources failed");
}

/**
 * https → JPEG data URL (XHR blob + canvas), ужимаем под storage.
 * Отдельный XHR: toDataURL в utils слишком короткий timeout для обоев.
 */
export async function remoteImageToJpegDataUrl(
  imageUrl: string,
  maxChars = BACKGROUND_MAX_CHARS
): Promise<string> {
  if (imageUrl.startsWith("data:image/")) {
    if (imageUrl.length <= maxChars) return imageUrl;
    return recompressDataUrl(imageUrl, maxChars);
  }
  const blob = await fetchImageBlob(imageUrl);
  const raw = await blobToDataUrl(blob);
  if (raw.length <= maxChars && /^data:image\/jpeg/i.test(raw)) return raw;
  return recompressDataUrl(raw, maxChars);
}

function fetchImageBlob(url: string, timeoutMs = 20000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        resolve(xhr.response as Blob);
      } else reject(new Error(`HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send();
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error || new Error("FileReader failed"));
    r.readAsDataURL(blob);
  });
}

async function recompressDataUrl(
  dataUrl: string,
  maxChars: number
): Promise<string> {
  const img = await loadImage(dataUrl);
  const steps = [
    { edge: 1920, q: 0.85 },
    { edge: 1280, q: 0.72 },
    { edge: 960, q: 0.62 },
    { edge: 720, q: 0.55 },
  ];
  for (const step of steps) {
    const scale = Math.min(1, step.edge / Math.max(img.naturalWidth, img.naturalHeight, 1));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", step.q);
    if (out.length <= maxChars) return out;
  }
  throw new Error("Image too large for storage");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = src;
  });
}
