/**
 * Drop изображений на new-tab: распознать URL/file и сжать для фона.
 * Без DOM-зависимостей в classify — удобно тестировать.
 */

export type DropImageSource =
  | { kind: "url"; url: string }
  | { kind: "file"; file: File };

/** Минимальный DataTransfer-like для unit-тестов */
export type DataTransferLike = {
  files?: ArrayLike<File> | null;
  types?: readonly string[] | null;
  getData?: (format: string) => string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i;

/** Похоже на URL картинки */
export function looksLikeImageUrl(url: string): boolean {
  const u = (url || "").trim();
  if (!u) return false;
  if (u.startsWith("data:image/")) return true;
  if (u.startsWith("blob:")) return true;
  try {
    const parsed = new URL(u);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    if (IMAGE_EXT.test(parsed.pathname)) return true;
    // без расширения — всё равно пробуем (CDN часто без .jpg)
    return true;
  } catch {
    return false;
  }
}

/** Извлечь src из HTML snippet (drag из браузера) */
export function extractImgSrcFromHtml(html: string): string | null {
  if (!html) return null;
  const m =
    html.match(/<img[^>]+src=["']([^"']+)["']/i) ||
    html.match(/src=["']([^"']+)["']/i);
  return m?.[1] || null;
}

/** Разобрать drop: file image/* → file; иначе uri-list / html → url */
export function parseImageDrop(dt: DataTransferLike | null | undefined): DropImageSource | null {
  if (!dt) return null;
  const files = dt.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f && typeof f.type === "string" && f.type.startsWith("image/")) {
        return { kind: "file", file: f };
      }
    }
  }
  const getData = dt.getData?.bind(dt);
  if (getData) {
    const uriList = (getData("text/uri-list") || "").split(/\r?\n/);
    for (const line of uriList) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (looksLikeImageUrl(t)) return { kind: "url", url: t };
    }
    const html = getData("text/html") || "";
    const fromHtml = extractImgSrcFromHtml(html);
    if (fromHtml && looksLikeImageUrl(fromHtml)) {
      return { kind: "url", url: fromHtml };
    }
    const plain = (getData("text/plain") || "").trim();
    if (plain && looksLikeImageUrl(plain)) return { kind: "url", url: plain };
  }
  return null;
}

/** Сжать File → JPEG data URL (maxEdge) под квоту storage */
export async function fileToBackgroundDataUrl(
  file: File,
  {
    maxEdge = 1920,
    quality = 0.85,
    maxChars = 2_800_000,
  }: { maxEdge?: number; quality?: number; maxChars?: number } = {}
): Promise<string> {
  if (file.type === "image/svg+xml") {
    return readFileAsDataUrl(file);
  }

  const steps: { edge: number; q: number }[] = [
    { edge: maxEdge, q: quality },
    { edge: 1280, q: 0.72 },
    { edge: 960, q: 0.62 },
    { edge: 720, q: 0.55 },
  ];

  let lastErr: unknown;
  for (const step of steps) {
    try {
      const dataUrl = await encodeFileJpeg(file, step.edge, step.q);
      if (dataUrl.length <= maxChars) return dataUrl;
      lastErr = new Error(`encoded too large: ${dataUrl.length}`);
    } catch (e) {
      lastErr = e;
    }
  }
  // Последний шанс — сырой FileReader (может тоже не влезть)
  try {
    const raw = await readFileAsDataUrl(file);
    if (raw.length <= maxChars) return raw;
  } catch (e) {
    lastErr = e;
  }
  throw lastErr instanceof Error ? lastErr : new Error("encode failed");
}

async function encodeFileJpeg(
  file: File,
  maxEdge: number,
  quality: number
): Promise<string> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // createImageBitmap недоступен / формат — через <img> + FileReader
    return drawViaHtmlImage(file, maxEdge, quality);
  }
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height, 1));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close?.();
  }
}

async function drawViaHtmlImage(
  file: File,
  maxEdge: number,
  quality: number
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight, 1));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readFileAsDataUrl(file);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error || new Error("FileReader failed"));
    r.readAsDataURL(file);
  });
}

/** URL для Open: file → object URL; url → as-is */
export function openUrlForSource(source: DropImageSource): string {
  if (source.kind === "url") return source.url;
  return URL.createObjectURL(source.file);
}
