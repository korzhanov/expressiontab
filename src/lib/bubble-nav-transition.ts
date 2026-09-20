/**
 * Анимация перехода: шарик → круг на весь экран → navigate.
 * Цвет — hue пузыря; финал ближе к фону new-tab (#222).
 */

/** Слой поверх filterBar / tooltips — иначе overflow/z-index поля режет burst */
export const NAV_BURST_LAYER_ID = "expressiontab-nav-burst-layer";

/** Радиус (не диаметр), чтобы круг с центром (cx,cy) покрыл viewport. */
export function viewportCoverRadius(
  cx: number,
  cy: number,
  vw: number,
  vh: number
): number {
  const corners: [number, number][] = [
    [0, 0],
    [vw, 0],
    [0, vh],
    [vw, vh],
  ];
  let max = 0;
  for (const [x, y] of corners) {
    max = Math.max(max, Math.hypot(x - cx, y - cy));
  }
  // +2% запас на субпиксели / safe-area
  return max * 1.02;
}

/** Hue как у BubbleDot (для burst-круга). */
export function bubbleNavHue(b: {
  kind?: string;
  isBookmark?: boolean;
  isSession?: boolean;
  isOverflowGroup?: boolean;
  groupable?: boolean;
}): number {
  if (b.isBookmark) return 42;
  if (b.isOverflowGroup) return 320;
  if (b.isSession) return 175;
  if (b.groupable) return 280;
  if (b.kind === "child") return 165;
  return 200;
}

/** Пропустить анимацию (a11y / без URL). */
export function shouldSkipNavTransition(opts?: {
  reducedMotion?: boolean;
  url?: string;
}): boolean {
  if (opts?.reducedMotion) return true;
  const url = opts?.url || "";
  if (!url || !(url.startsWith("http://") || url.startsWith("https://")))
    return true;
  return false;
}

/** Fixed-слой на body выше filterBar (z=10) и tooltip (z=10000). */
export function getNavBurstLayer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let layer = document.getElementById(NAV_BURST_LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = NAV_BURST_LAYER_ID;
    layer.setAttribute("data-nav-burst-layer", "");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "300000";
    layer.style.pointerEvents = "none";
    document.body.appendChild(layer);
  }
  return layer;
}

/**
 * Svelte action: переносит navBurst на body-слой
 * (иначе overflow:hidden / stacking поля режет круг под filterBar).
 */
export function navBurstPortal(node: HTMLElement) {
  const layer = getNavBurstLayer();
  if (layer) layer.appendChild(node);
  return {
    destroy() {
      // no-op — Svelte detach сам снимет ноду
    },
  };
}
