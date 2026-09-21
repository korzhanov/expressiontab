/** Слой для tooltip: поверх dial, не перехватывает клики. */
export const TOOLTIP_LAYER_ID = "expressiontab-tooltip-layer";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export type TooltipPos = { top: number; left: number };

const GAP = 6;

/** Закрыть предыдущий открытый tooltip (один на всё приложение). */
let activeClose: (() => void) | null = null;
let activeToken = 0;

/**
 * Заявить активный tooltip: предыдущий закрывается сразу.
 * Возвращает token для releaseActiveTooltip.
 */
export function claimActiveTooltip(close: () => void): number {
  const prev = activeClose;
  const token = ++activeToken;
  activeClose = close;
  // Сначала новый closer — чтобы prev не обнулил текущего
  if (prev) prev();
  return token;
}

/** Снять claim, если это всё ещё наш token. */
export function releaseActiveTooltip(token: number): void {
  if (token === activeToken) {
    activeClose = null;
  }
}

/** Закрыть текущий активный tip (меню действий / unmount ряда). */
export function closeActiveTooltip(): void {
  const prev = activeClose;
  activeClose = null;
  if (prev) prev();
}

/** Сброс singleton (тесты). */
export function resetActiveTooltip(): void {
  activeClose = null;
  activeToken = 0;
}

/** Не вызывать: агрессивный remove ломает Svelte detach (removeChild null). */
export function flushTooltipLayer(_keep?: HTMLElement | null): void {
  // claimActiveTooltip → forceClose → {#if} destroy — единственный путь очистки
}

/** Создать / вернуть fixed-слой на body. */
export function getTooltipLayer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let layer = document.getElementById(TOOLTIP_LAYER_ID);
  if (!layer) {
    layer = document.createElement("div");
    layer.id = TOOLTIP_LAYER_ID;
    layer.setAttribute("data-tooltip-layer", "");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.zIndex = "10000";
    layer.style.pointerEvents = "none";
    document.body.appendChild(layer);
  }
  return layer;
}

/**
 * Svelte 3 action: переносит ноду в tooltip-слой.
 * destroy — no-op: Svelte detach сам снимет с layer.
 * Нельзя child.remove() / flush до detach — иначе removeChild(null).
 */
export function tooltipPortal(
  node: HTMLElement,
  onPlaced?: (node: HTMLElement) => void
) {
  const layer = getTooltipLayer();
  if (layer) {
    // claimActiveTooltip уже закрыл предыдущий tip — не flush'ить DOM
    layer.appendChild(node);
  }
  onPlaced?.(node);
  return {
    destroy() {
      // no-op: detach Svelte снимет ноду с layer сам
    },
  };
}

/** Viewport-координаты якоря popup (position:fixed + transform в CSS). */
export function placeTooltip(
  trigger: {
    getBoundingClientRect: () =>
      | DOMRect
      | {
          top: number;
          left: number;
          right: number;
          bottom: number;
          width: number;
          height: number;
        };
  },
  side: TooltipSide,
  gap = GAP
): TooltipPos {
  const r = trigger.getBoundingClientRect();
  if (side === "top") {
    return { top: r.top - gap, left: r.left + r.width / 2 };
  }
  if (side === "bottom") {
    return { top: r.bottom + gap, left: r.left + r.width / 2 };
  }
  if (side === "left") {
    return { top: r.top + r.height / 2, left: r.left - gap };
  }
  return { top: r.top + r.height / 2, left: r.right + gap };
}

/** Не даём pill уехать за край экрана (учитываем CSS transform). */
export function clampTooltipPos(
  pos: TooltipPos,
  side: TooltipSide,
  size: { width: number; height: number },
  vw = 800,
  vh = 600,
  pad = 8
): TooltipPos {
  let { top, left } = pos;
  const { width: w, height: h } = size;
  if (side === "top" || side === "bottom") {
    const half = w / 2;
    left = Math.max(pad + half, Math.min(vw - pad - half, left));
  } else if (side === "left") {
    left = Math.max(pad + w, left);
  } else {
    left = Math.min(vw - pad - w, left);
  }
  if (side === "top") top = Math.max(pad + h, top);
  if (side === "bottom") top = Math.min(vh - pad - h, top);
  if (side === "left" || side === "right") {
    top = Math.max(pad + h / 2, Math.min(vh - pad - h / 2, top));
  }
  return { top, left };
}
