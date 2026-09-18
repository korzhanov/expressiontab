<script lang="ts">
  // Tooltip в духе shadcn: delay → fade popup, без native title
  import { fade } from "svelte/transition";

  /** Текст подсказки */
  export let content: string = "";
  /** Сторона относительно триггера */
  export let side: "top" | "bottom" | "left" | "right" = "top";
  /** Задержка перед показом (как delayDuration у shadcn) */
  export let delayDuration: number = 400;
  /** Блочный триггер (строка списка на всю ширину) */
  export let block: boolean = false;
  /** Выключить tooltip (например в lined, где title уже виден) */
  export let disabled: boolean = false;

  let open = false;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (showTimer) clearTimeout(showTimer);
    if (hideTimer) clearTimeout(hideTimer);
    showTimer = null;
    hideTimer = null;
  }

  function onEnter() {
    if (disabled || !content) return;
    clearTimers();
    showTimer = setTimeout(() => {
      open = true;
    }, delayDuration);
  }

  function onLeave() {
    clearTimers();
    // Короткая задержка — меньше мерцания при переходе на контент
    hideTimer = setTimeout(() => {
      open = false;
    }, 80);
  }
</script>

<!-- role=group: обёртка триггера + popup -->
<span
  class="tooltip-root"
  class:block
  class:open
  on:mouseenter={onEnter}
  on:mouseleave={onLeave}
  on:focusin={onEnter}
  on:focusout={onLeave}
>
  <slot />
  {#if open && content && !disabled}
    <span
      class="tooltip-content"
      class:top={side === "top"}
      class:bottom={side === "bottom"}
      class:left={side === "left"}
      class:right={side === "right"}
      role="tooltip"
      transition:fade={{ duration: 120 }}
    >
      {content}
    </span>
  {/if}
</span>

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
  /* shadcn-like: foreground pill на background */
  .tooltip-content {
    position: absolute;
    z-index: 1100;
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
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-content.bottom {
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
  }
  .tooltip-content.left {
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }
  .tooltip-content.right {
    left: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
  }
</style>
