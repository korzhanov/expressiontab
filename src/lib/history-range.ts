/** Пресеты диапазона history.search для filter bar. */
export type HistoryRangePreset = "1w" | "4w" | "12w" | "all" | "custom";

export type HistoryRangeState = {
  preset: HistoryRangePreset;
  /** yyyy-mm-dd для custom */
  fromDate: string;
  toDate: string;
};

const MS_DAY = 86400000;

/** Границы startTime/endTime (ms) для chrome.history.search. */
export function historySearchBounds(range: HistoryRangeState): {
  startTime: number;
  endTime: number;
} {
  const now = Date.now();
  if (range.preset === "all") {
    return { startTime: 0, endTime: now };
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
  if (range.preset === "1w") return "1 week";
  if (range.preset === "4w") return "4 weeks";
  if (range.preset === "12w") return "12 weeks";
  if (range.fromDate && range.toDate) {
    return `${range.fromDate} – ${range.toDate}`;
  }
  return "4 weeks";
}

/** Восстановить state из localStorage (без throw). */
export function loadHistoryRangeFromStorage(): HistoryRangeState {
  const preset =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("historyRangePreset") as HistoryRangePreset)) ||
    "4w";
  const fromDate =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("historyRangeFrom")) ||
    "";
  const toDate =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("historyRangeTo")) ||
    "";
  const valid: HistoryRangePreset[] = ["1w", "4w", "12w", "all", "custom"];
  return {
    preset: valid.includes(preset) ? preset : "4w",
    fromDate,
    toDate,
  };
}

export function saveHistoryRangeToStorage(range: HistoryRangeState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("historyRangePreset", range.preset);
  localStorage.setItem("historyRangeFrom", range.fromDate);
  localStorage.setItem("historyRangeTo", range.toDate);
}
