/**
 * Отложить работу до idle — не конкурировать с physics/UI.
 * timeout — чтобы очередь всё же двигалась при постоянной нагрузке.
 */
export function scheduleIdle(
  task: () => void,
  opts?: { timeoutMs?: number }
): void {
  const timeout = opts?.timeoutMs ?? 1500;
  const ric = (
    globalThis as {
      requestIdleCallback?: (
        cb: () => void,
        o?: { timeout: number }
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") {
    ric(() => task(), { timeout });
    return;
  }
  // Fallback: короткий yield после кадра
  setTimeout(task, 48);
}
