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

/** Сжать File → JPEG data URL (maxEdge) для localStorage quota */
export async function fileToBackgroundDataUrl(
  file: File,
  {
    maxEdge = 1920,
    quality = 0.85,
  }: { maxEdge?: number; quality?: number } = {}
): Promise<string> {
  // data: уже мелкий — отдать как есть через FileReader
  if (file.type === "image/svg+xml") {
    return readFileAsDataUrl(file);
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readFileAsDataUrl(file);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close?.();
  }
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
