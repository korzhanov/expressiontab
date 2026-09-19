<script lang="ts">
  // Tooltip в духе shadcn: delay → fade popup на портале (слой над overflow:hidden)
  // Только один активный: claimActiveTooltip закрывает предыдущий
  import { fade } from "svelte/transition";
  import { onDestroy, onMount } from "svelte";
  import {
    claimActiveTooltip,
    clampTooltipPos,
    placeTooltip,
    releaseActiveTooltip,
    tooltipPortal,
    type TooltipSide,
  } from "./portal";

  /** Текст подсказки */
  export let content: string = "";
  /** Сторона относительно триггера */
  export let side: TooltipSide = "top";
  /** Задержка перед показом (как delayDuration у shadcn) */
  export let delayDuration: number = 400;
  /** Блочный триггер (строка списка на всю ширину) */
  export let block: boolean = false;
  /** Выключить tooltip (например в lined, где title уже виден) */
  export let disabled: boolean = false;
  /**
   * List/VirtualScroll: закрывать на scroll (leave часто не приходит).
   * Bubble: false — tip живёт до leave; на scroll только sync позиции.
   */
  export let closeOnScroll: boolean = true;

  let open = false;
  let rootEl: HTMLElement;
  let popupEl: HTMLElement;
  let pos = { top: 0, left: 0 };
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  /** Token singleton — чужой claim закрывает нас */
  let claimToken = 0;

  function clearTimers() {
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
    showTimer = null;
    hideTimer = null;
  }

  function syncPos(popup?: HTMLElement) {
    if (!rootEl) return;
    let next = placeTooltip(rootEl, side);
    if (popup && typeof window !== "undefined") {
      const r = popup.getBoundingClientRect();
      next = clampTooltipPos(
        next,
        side,
        { width: r.width, height: r.height },
        window.innerWidth,
        window.innerHeight
      );
    }
    pos = next;
  }

  function onPopupPlaced(node: HTMLElement) {
    syncPos(node);
  }

  /** Закрыть сразу (без delay) — вызывается и из claim другого tooltip. */
  function forceClose() {
    clearTimers();
    if (!open) return;
    open = false;
    releaseActiveTooltip(claimToken);
  }

  function showNow() {
    if (disabled || !content) return;
    syncPos();
    claimToken = claimActiveTooltip(forceClose);
    open = true;
  }

  function onEnter() {
    if (disabled || !content) return;
    clearTimers();
    showTimer = setTimeout(showNow, delayDuration);
  }

  function onLeave() {
    clearTimers();
    // Короткая задержка — меньше мерцания при переходе на контент
    hideTimer = setTimeout(() => {
      forceClose();
    }, 80);
  }

  function onScrollOrResize() {
    if (!open) return;
    // List: закрыть. Bubble: подтянуть к триггеру (поле скроллится часто)
    if (closeOnScroll) forceClose();
    else syncPos(popupEl);
  }

  onMount(() => {
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener("scroll", onScrollOrResize, opts);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, opts);
      window.removeEventListener("resize", onScrollOrResize);
    };
  });

  onDestroy(() => {
    // Unmount ряда VirtualScroll без mouseleave — сразу снять portal
    forceClose();
  });

  // disabled (lined title) — не оставлять висящий pill
  $: if (disabled && open) forceClose();
</script>

<!-- role=group: обёртка триггера; popup уходит в #expressiontab-tooltip-layer -->
<span
  bind:this={rootEl}
  class="tooltip-root"
  class:block
  class:open
  role="group"
  on:mouseenter={onEnter}
  on:mouseleave={onLeave}
  on:focusin={onEnter}
  on:focusout={onLeave}
>
  <slot />
</span>
{#if open && content && !disabled}
  <span
    bind:this={popupEl}
    use:tooltipPortal={onPopupPlaced}
    class="tooltip-content"
    class:top={side === "top"}
    class:bottom={side === "bottom"}
    class:left={side === "left"}
    class:right={side === "right"}
    role="tooltip"
    style="top: {pos.top}px; left: {pos.left}px;"
    transition:fade={{ duration: 80 }}
  >
    {content}
  </span>
{/if}

<style>
  .tooltip-root {
    position: relative;
    display: inline-flex;
    max-width: 100%;
    vertical-align: middle;
  }
  .tooltip-root.block {
    display: block;
    width: 100%;
  }
  /* shadcn-like: pill на отдельном слое, position:fixed от триггера */
  .tooltip-content {
    position: fixed;
    z-index: 10000;
    /* max-content — иначе в узком dial shrink-to-fit даёт 1 символ/строку */
    width: max-content;
    min-width: 6rem;
    max-width: min(320px, 80vw);
    padding: 0.4rem 0.75rem;
    border-radius: 0.375rem;
    background: #fafafa;
    color: #141414;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0.01em;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: normal;
    pointer-events: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }
  .tooltip-content.top {
    transform: translate(-50%, -100%);
  }
  .tooltip-content.bottom {
    transform: translate(-50%, 0);
  }
  .tooltip-content.left {
    transform: translate(-100%, -50%);
  }
  .tooltip-content.right {
    transform: translate(0, -50%);
  }
</style>
