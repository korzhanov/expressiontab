/** Режимы часов на new-tab (клик по кругу) */
export type TimerMode = 0 | 1 | 2;

/** 0 — до полуночи; 1 — обычные; 2 — скрыты */
export const TIMER_MODE_COUNTDOWN = 0 as const;
export const TIMER_MODE_CLOCK = 1 as const;
export const TIMER_MODE_HIDDEN = 2 as const;

const STORAGE_KEY = "timerMode";

/** Валидация числа из storage */
export function parseTimerMode(raw: unknown): TimerMode {
  const n = Number(raw);
  if (n === 0 || n === 1 || n === 2) return n;
  return TIMER_MODE_COUNTDOWN;
}

/** Из localStorage; по умолчанию countdown (как раньше) */
export function loadTimerMode(): TimerMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Нет ключа — прежнее поведение (countdown)
    if (raw == null) return TIMER_MODE_COUNTDOWN;
    return parseTimerMode(raw);
  } catch {
    /* private mode */
  }
  return TIMER_MODE_COUNTDOWN;
}

/** Сохранить режим */
export function saveTimerMode(mode: TimerMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(mode));
  } catch {
    /* ignore */
  }
}

/** Следующий: countdown → clock → hidden → countdown… */
export function nextTimerMode(current: TimerMode): TimerMode {
  return ((current + 1) % 3) as TimerMode;
}

/** Часы видны (не третий шаг цикла) */
export function isTimerVisible(mode: TimerMode): boolean {
  return mode !== TIMER_MODE_HIDDEN;
}
