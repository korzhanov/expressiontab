/**
 * CSV экспорт/импорт ссылок dial (url, title, visitCount, lastVisitTime, isBookmark).
 * Чистая логика без DOM — для bun:test и UI Anchores.
 */
import { shouldIgnoreUrl, type BookmarkNode } from "./bookmarks";

/** Колонки CSV (фиксированный порядок). */
export const CSV_HEADERS = [
  "url",
  "title",
  "visitCount",
  "lastVisitTime",
  "isBookmark",
] as const;

export type CsvLinkRow = {
  url: string;
  title: string;
  visitCount: number;
  lastVisitTime: number;
  isBookmark: boolean;
};

/** Экранирование поля RFC4180: кавычки удваиваем, поле в "…". */
export function escapeCsvField(value: string): string {
  const s = value ?? "";
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Разбор одной строки CSV с учётом кавычек. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // "" → литерал "
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** BookmarkNode[] → CSV-текст (с заголовком). */
export function serializeLinksToCsv(nodes: BookmarkNode[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const n of nodes) {
    const url = (n.url || "").trim();
    if (shouldIgnoreUrl(url)) continue;
    const row = [
      escapeCsvField(url),
      escapeCsvField((n.title || "").trim()),
      String(n.visitCount ?? 0),
      String(n.lastVisitTime ?? 0),
      n.isBookmark ? "true" : "false",
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n") + (lines.length > 1 ? "\n" : "");
}

/** Нормализация заголовка → индекс колонки. */
function headerIndexMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.trim().toLowerCase()] = i;
  });
  return map;
}

/**
 * CSV-текст → строки ссылок.
 * Требуется колонка url (или первая колонка без заголовка).
 */
export function parseLinksFromCsv(text: string): CsvLinkRow[] {
  const raw = (text || "").replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const first = splitCsvLine(lines[0]).map((c) => c.trim());
  const lower = first.map((c) => c.toLowerCase());
  const hasHeader = lower.includes("url");
  let start = 0;
  let idx: Record<string, number> = {
    url: 0,
    title: 1,
    visitcount: 2,
    lastvisittime: 3,
    isbookmark: 4,
  };
  if (hasHeader) {
    idx = headerIndexMap(first);
    start = 1;
  }

  const rows: CsvLinkRow[] = [];
  const seen = new Set<string>();
  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const url = (cols[idx.url ?? 0] || "").trim();
    if (shouldIgnoreUrl(url) || seen.has(url)) continue;
    seen.add(url);
    const title = (cols[idx.title ?? 1] || "").trim() || url;
    const visitCount = Number(cols[idx.visitcount ?? 2] || 0) || 0;
    const lastVisitTime = Number(cols[idx.lastvisittime ?? 3] || 0) || 0;
    const flag = (cols[idx.isbookmark ?? 4] || "").trim().toLowerCase();
    const isBookmark = flag === "true" || flag === "1" || flag === "yes";
    rows.push({ url, title, visitCount, lastVisitTime, isBookmark });
  }
  return rows;
}

/** Имя файла для download. */
export function csvExportFilename(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `expressiontab-links-${now.getFullYear()}${pad(
    now.getMonth() + 1
  )}${pad(now.getDate())}.csv`;
}

/**
 * Скачать CSV в браузере (Blob + <a download>).
 * Возвращает число экспортированных строк (без заголовка).
 */
export function downloadLinksCsv({
  nodes,
  filename,
  doc = typeof document !== "undefined" ? document : null,
}: {
  nodes: BookmarkNode[];
  filename?: string;
  doc?: Document | null;
}): { rows: number; filename: string } {
  const csv = serializeLinksToCsv(nodes);
  const rows = Math.max(0, csv.split(/\r?\n/).filter(Boolean).length - 1);
  const name = filename || csvExportFilename();
  if (!doc) return { rows, filename: name };
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = doc.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  doc.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { rows, filename: name };
}

/** Минимальный API закладок для импорта. */
export type ImportBookmarksChrome = {
  bookmarks: {
    create: (
      bookmark: { title?: string; url?: string },
      callback?: (node: unknown) => void
    ) => void | Promise<unknown>;
  };
};

function createBookmark(
  api: ImportBookmarksChrome,
  row: { url: string; title: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ret = api.bookmarks.create(
        { url: row.url, title: row.title },
        () => resolve()
      );
      if (ret && typeof (ret as Promise<unknown>).then === "function") {
        (ret as Promise<unknown>).then(() => resolve()).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/** Импорт CSV → chrome.bookmarks.create (по одной). */
export async function importLinksFromCsvText({
  text,
  chromeApi,
  maxRows = 5000,
}: {
  text: string;
  chromeApi: ImportBookmarksChrome;
  maxRows?: number;
}): Promise<{ imported: number; skipped: number }> {
  const rows = parseLinksFromCsv(text).slice(0, maxRows);
  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    try {
      await createBookmark(chromeApi, row);
      imported += 1;
    } catch {
      skipped += 1;
    }
  }
  return { imported, skipped };
}
