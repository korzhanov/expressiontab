<script lang="ts">
  /**
   * ПКМ-меню шарика: Bookmark / Copy / Delete на portal-слое (как tooltip).
   * Отдельно от list `.multiButton` — close на scroll / outside click.
   */
  import Icon, { Star, Trash, Duplicate } from "svelte-hero-icons";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import {
    clampTooltipPos,
    placeTooltip,
    tooltipPortal,
  } from "./components/ui/tooltip/portal";

  /** Показать меню (ПКМ из BubbleDot) */
  export let open: boolean = false;
  /** Якорь — <a class="bubbleDot"> */
  export let anchorEl: HTMLElement | null = null;
  /** Золотая кнопка Star */
  export let isBookmark: boolean = false;
  export let onBookmark: (e: Event) => void = () => {};
  export let onCopy: (e: Event) => void = () => {};
  export let onDelete: (e: Event) => void = () => {};
  /** Закрыть (outside / scroll) — родитель снимает claim */
  export let onRequestClose: () => void = () => {};

  let menuPos = { top: 0, left: 0 };

  function syncMenuPos(menuEl?: HTMLElement) {
    if (!anchorEl || typeof window === "undefined") return;
    let next = placeTooltip(anchorEl, "top", 10);
    const size = menuEl
      ? { width: menuEl.offsetWidth, height: menuEl.offsetHeight }
      : { width: 120, height: 44 };
    next = clampTooltipPos(
      next,
      "top",
      size,
      window.innerWidth,
      window.innerHeight
    );
    menuPos = next;
  }

  function onMenuPlaced(node: HTMLElement) {
    // pointer-events на слое none — включаем на меню
    node.style.pointerEvents = "auto";
    syncMenuPos(node);
  }

  // При открытии — первичная позиция до measure
  $: if (open && anchorEl) syncMenuPos();

  onMount(() => {
    const onDocDown = (e: Event) => {
      if (!open) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".bubbleActions")) return;
      if (anchorEl && t && anchorEl.contains(t)) return;
      onRequestClose();
    };
    // Меню (не tip) закрываем на scroll
    const onScrollOrResize = () => {
      if (open) onRequestClose();
    };
    const opts: AddEventListenerOptions = { capture: true };
    document.addEventListener("pointerdown", onDocDown, opts);
    window.addEventListener("scroll", onScrollOrResize, opts);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", onDocDown, opts);
      window.removeEventListener("scroll", onScrollOrResize, opts);
      window.removeEventListener("resize", onScrollOrResize);
    };
  });
</script>

{#if open}
  <div
    class="bubbleActions"
    role="toolbar"
    aria-label="Bubble actions"
    use:tooltipPortal={onMenuPlaced}
    style="top: {menuPos.top}px; left: {menuPos.left}px;"
    transition:fade={{ duration: 120 }}
  >
    <button
      class:isBookmark
      type="button"
      aria-label="Bookmark"
      title="Bookmark"
      on:click={onBookmark}
      on:pointerdown|stopPropagation
    >
      <Icon src={Star} solid size="18" />
    </button>
    <button
      type="button"
      aria-label="Copy url"
      title="Copy url"
      on:click={onCopy}
      on:pointerdown|stopPropagation
    >
      <Icon src={Duplicate} solid size="18" />
    </button>
    <button
      type="button"
      aria-label="Delete"
      title="Delete"
      on:click={onDelete}
      on:pointerdown|stopPropagation
    >
      <Icon src={Trash} solid size="18" />
    </button>
  </div>
{/if}

<style lang="scss">
  /* Fixed-слой над полем с overflow:hidden — как tooltip */
  .bubbleActions {
    position: fixed;
    z-index: 10001;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(250, 250, 250, 0.96);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    transform: translate(-50%, -100%);
    pointer-events: auto;
  }
  .bubbleActions button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 100%;
    background: transparent;
    color: #141414;
    line-height: 0;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .bubbleActions button:hover {
    background: #141414;
    color: #fff;
  }
  .bubbleActions button.isBookmark {
    background: #f0c040;
    color: #3a2a00;
  }
  .bubbleActions button.isBookmark:hover {
    background: #d4a020;
    color: #fff;
  }
</style>
