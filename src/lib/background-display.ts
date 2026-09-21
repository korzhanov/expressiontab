/**
 * Отображение фона: длинный data: URL в style= ломает/не рисует Chrome.
 * Для CSS — короткий blob: URL; в storage остаётся data:.
 */

/** data:image/...;base64,... → blob: для background-image */
export function dataUrlToObjectUrl(dataUrl: string): string {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("not a data URL");
  }
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("malformed data URL");
  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const isBase64 = /;base64/i.test(header);
  const mime = (header.match(/^data:([^;,]+)/i)?.[1] || "image/jpeg").trim();
  let bytes: Uint8Array;
  if (isBase64) {
    const bin = atob(payload);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } else {
    const decoded = decodeURIComponent(payload);
    bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  }
  // buffer: slice — корректный ArrayBuffer для BlobPart (не SharedArrayBuffer)
  const buf = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  return URL.createObjectURL(new Blob([buf], { type: mime }));
}

/** URL для CSS: data: → blob:; http(s)/asset — как есть */
export function toCssBackgroundUrl(stored: string): {
  cssUrl: string;
  revoke: string | null;
} {
  if (!stored) return { cssUrl: "", revoke: null };
  if (stored.startsWith("data:")) {
    const cssUrl = dataUrlToObjectUrl(stored);
    return { cssUrl, revoke: cssUrl };
  }
  return { cssUrl: stored, revoke: null };
}

/** Безопасная подстановка в url("...") */
export function cssUrlValue(url: string): string {
  // Экранируем \ и " — base64/blob обычно чистые
  const safe = url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${safe}")`;
}
