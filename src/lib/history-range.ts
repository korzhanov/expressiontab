/** Пресеты диапазона history.search для filter bar. */
export type HistoryRangePreset =
  | "today"
  | "yesterday"
  | "1w"
  | "4w"
  | "12w"
  | "all"
  | "custom";

export type HistoryRangeState = {
  preset: HistoryRangePreset;
  /** yyyy-mm-dd для custom / отображения в date inputs */
  fromDate: string;
  toDate: string;
};

const MS_DAY = 86400000;

/** Локальная дата → yyyy-mm-dd для <input type="date">. */
export function toDateInputValue(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Начало локальных суток (00:00) для ms. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** from/to для пресета — чтобы date inputs всегда были заполнены. */
export function datesForPreset(
  preset: HistoryRangePreset,
  now = Date.now()
): { fromDate: string; toDate: string } {
  const today = toDateInputValue(now);
  if (preset === "today") {
    return { fromDate: today, toDate: today };
  }
  if (preset === "yesterday") {
    const y = toDateInputValue(now - MS_DAY);
    return { fromDate: y, toDate: y };
  }
  if (preset === "1w") {
    return { fromDate: toDateInputValue(now - 7 * MS_DAY), toDate: today };
  }
  if (preset === "4w") {
    return { fromDate: toDateInputValue(now - 28 * MS_DAY), toDate: today };
  }
  if (preset === "12w") {
    return { fromDate: toDateInputValue(now - 84 * MS_DAY), toDate: today };
  }
  if (preset === "all") {
    // «Всё время» — from пустой не рисуем: далёкая нижняя граница
    return { fromDate: "2000-01-01", toDate: today };
  }
  // custom — вызывающий сам задаёт даты; fallback 4w
  return { fromDate: toDateInputValue(now - 28 * MS_DAY), toDate: today };
}

/**
 * Черновик date inputs из текущего range:
 * custom с датами — как есть; иначе из пресета.
 */
export function draftDatesFromRange(
  range: HistoryRangeState,
  now = Date.now()
): { fromDate: string; toDate: string } {
  if (range.preset === "custom" && range.fromDate && range.toDate) {
    return { fromDate: range.fromDate, toDate: range.toDate };
  }
  if (range.fromDate && range.toDate && range.preset !== "custom") {
    // Уже сохранены даты пресета — обновим to=сегодня для скользящих окон
    const fresh = datesForPreset(range.preset, now);
    if (range.preset === "today" || range.preset === "yesterday") {
      return fresh;
    }
    if (range.preset === "all") {
      return { fromDate: range.fromDate || fresh.fromDate, toDate: fresh.toDate };
    }
    // 1w/4w/12w — сдвигаем относительно сейчас
    return fresh;
  }
  return datesForPreset(
    range.preset === "custom" ? "4w" : range.preset,
    now
  );
}

/** Границы startTime/endTime (ms) для chrome.history.search. */
export function historySearchBounds(range: HistoryRangeState): {
  startTime: number;
  endTime: number;
} {
  const now = Date.now();
  if (range.preset === "all") {
    return { startTime: 0, endTime: now };
  }
  if (range.preset === "today") {
    return { startTime: startOfLocalDay(now), endTime: now };
  }
  if (range.preset === "yesterday") {
    const today0 = startOfLocalDay(now);
    return { startTime: today0 - MS_DAY, endTime: today0 - 1 };
  }
  if (range.preset === "1w") {
    return { startTime: now - 7 * MS_DAY, endTime: now };
  }
  if (range.preset === "4w") {
    return { startTime: now - 28 * MS_DAY, endTime: now };
  }
  if (range.preset === "12w") {
    return { startTime: now - 84 * MS_DAY, endTime: now };
  }
  const fromMs = range.fromDate
    ? new Date(`${range.fromDate}T00:00:00`).getTime()
    : now - 28 * MS_DAY;
  const toMs = range.toDate
    ? new Date(`${range.toDate}T23:59:59.999`).getTime()
    : now;
  return {
    startTime: Math.min(fromMs, toMs),
    endTime: Math.max(fromMs, toMs),
  };
}

/** Короткая подпись для .status («last 4 weeks» и т.д.). */
export function formatHistoryRangeLabel(range: HistoryRangeState): string {
  if (range.preset === "all") return "all time";
  if (range.preset === "today") return "today";
  if (range.preset === "yesterday") return "yesterday";
  if (range.preset === "1w") return "1 week";
  if (range.preset === "4w") return "4 weeks";
  if (range.preset === "12w") return "12 weeks";
  if (range.fromDate && range.toDate) {
    return `${range.fromDate} – ${range.toDate}`;
  }
  return "4 weeks";
}

const VALID_PRESETS: HistoryRangePreset[] = [
  "today",
  "yesterday",
  "1w",
  "4w",
  "12w",
  "all",
  "custom",
];

/** Восстановить state из localStorage (без throw). */
export function loadHistoryRangeFromStorage(): HistoryRangeState {
  const raw =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("historyRangePreset") as HistoryRangePreset)) ||
    "4w";
  const preset = VALID_PRESETS.includes(raw) ? raw : "4w";
  let fromDate =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("historyRangeFrom")) ||
    "";
  let toDate =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("historyRangeTo")) ||
    "";
  // Пустые date inputs — заполнить по пресету
  if (!fromDate || !toDate) {
    const filled = datesForPreset(preset === "custom" ? "4w" : preset);
    fromDate = fromDate || filled.fromDate;
    toDate = toDate || filled.toDate;
  }
  return { preset, fromDate, toDate };
}

export function saveHistoryRangeToStorage(range: HistoryRangeState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("historyRangePreset", range.preset);
  localStorage.setItem("historyRangeFrom", range.fromDate);
  localStorage.setItem("historyRangeTo", range.toDate);
}
