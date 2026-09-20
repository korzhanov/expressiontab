/** Режимы dial на new-tab; расширять здесь при новых представлениях */
export type DialViewMode = "bubble" | "lined";

/** Порядок переключения кнопкой changeView */
export const DIAL_VIEW_CYCLE: readonly DialViewMode[] = ["bubble", "lined"] as const;

const STORAGE_KEY = "dialViewMode";

/** Из localStorage; неизвестное → bubble */
export function loadDialViewMode(): DialViewMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "lined" || v === "bubble") return v;
  } catch {
    /* private mode / нет storage */
  }
  return "bubble";
}

/** Сохранить активный режим */
export function saveDialViewMode(mode: DialViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Следующий режим по циклу (bubble → lined → …) */
export function nextDialViewMode(current: DialViewMode): DialViewMode {
  const i = DIAL_VIEW_CYCLE.indexOf(current);
  const idx = i < 0 ? 0 : (i + 1) % DIAL_VIEW_CYCLE.length;
  return DIAL_VIEW_CYCLE[idx];
}

/** Lined-список (старый titleVisible) */
export function isLinedView(mode: DialViewMode): boolean {
  return mode === "lined";
}
