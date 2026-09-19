<script lang="ts">
  /**
   * Один пузырёк в BubbleField — позиция из d3-force, spawn CSS.
   * Groupable: inflate 3с → BubblePop → expand.
   * Тултипы — hover (портал). Действия Bookmark/Copy/Delete — только ПКМ на портале.
   */
  import Icon, { Star, Trash, Duplicate } from "svelte-hero-icons";
  import { fade } from "svelte/transition";
  import { onDestroy, onMount } from "svelte";
  import globe from "../assets/Globe.svg";
  import BubblePop from "./BubblePop.svelte";
  import * as Tooltip from "./components/ui/tooltip";
  import {
    claimActiveTooltip,
    clampTooltipPos,
    placeTooltip,
    releaseActiveTooltip,
    tooltipPortal,
  } from "./components/ui/tooltip/portal";
  import { longhover, GROUP_LONGHOVER_MS } from "./longhover";
  import { favicons } from "./stores";
  import type { BubbleEnterAnim, BubbleNode } from "./bubble-physics";

  export let bubble: BubbleNode;
  export let expanded: boolean = false;
  /** Несколько URL на хост — цвет-маркер, expand без «+» */
  export let groupable: boolean = false;
  /** Кадр physics — пересчёт transform без remount */
  export let frame: number = 0;
  /** Тик только при drag этого пузыря (остальные не инвалидируем) */
  export let dragTick: number = 0;
  /** Тик роста радиуса / лопания */
  export let inflateTick: number = 0;
  /** Пузырь сейчас тянут — grab/grabbing + без tooltip delay */
  export let dragging: boolean = false;
  /** Идёт изменение радиуса (unfold / hover-grow) */
  export let inflating: boolean = false;
  /** Активно лопание BubblePop */
  export let popping: boolean = false;
  /** Вход в viewport: initial / rise (скролл вниз) / fall (вверх) */
  export let enterAnim: BubbleEnterAnim = "initial";
  /** Сессия вкладок — другой hue */
  export let session: boolean = false;
  export let onInflateStart: () => void = () => {};
  export let onInflateCancel: () => void = () => {};
  export let onExpandCommit: () => void = () => {};
  export let onExpandRequest: () => void = () => {};
  export let onPointerDown: (e: PointerEvent) => void = () => {};
  export let onLinkClick: (e: MouseEvent) => void = () => {};
  /** Удалить пузырь из dial после pop */
  export let onDelete: () => void = () => {};
  /** Переключить закладку (Star) */
  export let onToggleBookmark: () => void = () => {};

  // frame | dragTick | inflateTick — Svelte видит мутации x/y/r
  $: size =
    frame + dragTick + inflateTick >= 0 ? bubble.r * 2 : bubble.r * 2;
  // initial — staggered spawn; rise/fall — короткий stagger у края;
  // child с spawnIndex 0 (burst из pop) — без задержки, вместе с лопанием
  $: delay =
    enterAnim === "initial"
      ? Math.min(bubble.spawnIndex, 48) * 0.035
      : Math.min((bubble.spawnIndex % 10) * 0.025, 0.18);
  $: tx = (bubble.x || 0) - bubble.r;
  $: ty = (bubble.y || 0) - bubble.r;
  // зависимость от тиков (иначе tx/ty не обновятся при мутации bubble)
  $: if (frame + dragTick + inflateTick >= 0) {
    tx = (bubble.x || 0) - bubble.r;
    ty = (bubble.y || 0) - bubble.r;
  }

  $: host = bubble.host;
  $: faviconSrc =
    $favicons.get(host) ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("favicon_" + host)
      : null) ||
    globe;

  /** Текст tooltip: title · visits · дата последнего визита */
  $: visitLine = `${bubble.visitCount} visit${bubble.visitCount === 1 ? "" : "s"}`;
  $: lastVisitLine =
    bubble.lastVisitTime != null && bubble.lastVisitTime > 0
      ? new Date(bubble.lastVisitTime).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";
  $: tooltipText = [bubble.title, visitLine, lastVisitLine]
    .filter(Boolean)
    .join(" · ");

  let multiButton = false;
  let localBookmark = !!bubble.isBookmark;
  $: localBookmark = !!bubble.isBookmark;
  /** Якорь для позиции меню (тот же <a>, что и тултип) */
  let anchorEl: HTMLAnchorElement | null = null;
  let menuPos = { top: 0, left: 0 };
  let claimToken = 0;

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

  function closeMenu() {
    if (!multiButton) return;
    multiButton = false;
    releaseActiveTooltip(claimToken);
  }

  function openMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Shift+ПКМ — expand (как раньше чистый contextmenu)
    if (e.shiftKey && groupable) {
      onExpandRequest();
      return;
    }
    if (dragging || popping) return;
    syncMenuPos();
    // Закрыть открытый тултип — меню занимает тот же слой
    claimToken = claimActiveTooltip(closeMenu);
    multiButton = true;
  }

  function onMenuPlaced(node: HTMLElement) {
    // pointer-events на слое none — включаем на меню
    node.style.pointerEvents = "auto";
    syncMenuPos(node);
  }

  async function copyToBuffer(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bubble.url);
    } catch (err) {
      console.error(err);
    }
    closeMenu();
  }

  function toggleBookmark(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    localBookmark = !localBookmark;
    onToggleBookmark();
  }

  function deleteBubble(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    onDelete();
  }

  onMount(() => {
    // Клик снаружи / скролл — закрыть меню действий
    const onDocDown = (e: Event) => {
      if (!multiButton) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(".bubbleActions")) return;
      if (anchorEl && t && anchorEl.contains(t)) return;
      closeMenu();
    };
    const onScrollOrResize = () => {
      if (multiButton) closeMenu();
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

  onDestroy(() => {
    releaseActiveTooltip(claimToken);
  });

  // Drag / pop — сразу спрятать меню
  $: if (dragging || popping) closeMenu();
</script>

<!-- Обёртка двигает физикой; внутренний .bubbleDot — spawn / pop -->
<div
  class="bubbleWrap"
  class:host={bubble.kind === "host"}
  class:child={bubble.kind === "child"}
  class:dragging
  class:inflating
  class:popping
  role="group"
  style="transform: translate({tx}px, {ty}px); width: {size}px; height: {size}px;"
>
  <Tooltip.Root
    content={tooltipText}
    side="bottom"
    delayDuration={400}
    disabled={dragging || inflating || popping || multiButton}
  >
    <a
      bind:this={anchorEl}
      class="bubbleDot"
      class:child={bubble.kind === "child"}
      class:host={bubble.kind === "host"}
      class:groupable
      class:expanded
      class:bookmark={localBookmark}
      class:session
      class:overflow={!!bubble.isOverflowGroup}
      class:dragging
      class:inflating
      class:popping
      class:enter-rise={enterAnim === "rise"}
      class:enter-fall={enterAnim === "fall"}
      href={bubble.url}
      rel="noopener noreferrer"
      draggable="false"
      style="animation-delay: {delay}s;"
      use:longhover={groupable && !dragging && !popping
        ? GROUP_LONGHOVER_MS
        : 86400000}
      on:mouseenter={() => {
        // Только inflate — меню только по ПКМ
        if (groupable && !dragging && !popping) onInflateStart();
      }}
      on:mouseleave={() => {
        if (groupable) onInflateCancel();
      }}
      on:longhover|preventDefault={() => {
        if (groupable && !dragging) onExpandCommit();
      }}
      on:contextmenu={openMenu}
      on:dragstart|preventDefault
      on:pointerdown={onPointerDown}
      on:click={onLinkClick}
    >
      <div class="popLayer" aria-hidden="true">
        <BubblePop active={popping} />
      </div>
      <span class="bubbleDot__shine"></span>
      {#if groupable}
        <span class="bubbleDot__groupRing" aria-hidden="true"></span>
      {/if}
      <!-- Фавикон по центру; закладка — золотой шар (--hue) -->
      <span class="bubbleDot__faviconWrap">
        <img
          class="bubbleDot__favicon"
          src={faviconSrc}
          alt=""
          width="22"
          height="22"
          loading="lazy"
          draggable="false"
        />
      </span>
      {#if bubble.isOverflowGroup && (bubble.overflowCount || 0) > 0}
        <span class="bubbleDot__overflowBadge">+{bubble.overflowCount}</span>
      {/if}
    </a>
  </Tooltip.Root>
</div>
<!-- Меню на том же fixed-слое, что и тултипы — только ПКМ -->
{#if multiButton && !dragging && !popping}
  <div
    class="bubbleActions"
    role="toolbar"
    aria-label="Bubble actions"
    use:tooltipPortal={onMenuPlaced}
    style="top: {menuPos.top}px; left: {menuPos.left}px;"
    transition:fade={{ duration: 120 }}
  >
    <button
      class:isBookmark={localBookmark}
      type="button"
      aria-label="Bookmark"
      title="Bookmark"
      on:click={toggleBookmark}
      on:pointerdown|stopPropagation
    >
      <Icon src={Star} solid size="18" />
    </button>
    <button
      type="button"
      aria-label="Copy url"
      title="Copy url"
      on:click={copyToBuffer}
      on:pointerdown|stopPropagation
    >
      <Icon src={Duplicate} solid size="18" />
    </button>
    <button
      type="button"
      aria-label="Delete"
      title="Delete"
      on:click={deleteBubble}
      on:pointerdown|stopPropagation
    >
      <Icon src={Trash} solid size="18" />
    </button>
  </div>
{/if}

<style lang="scss">
  .bubbleWrap {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
    pointer-events: none;
  }
  /* Host выше детей — inflate/hover не перекрывают дети */
  .bubbleWrap.child {
    z-index: 1;
  }
  .bubbleWrap.host {
    z-index: 3;
  }
  .bubbleWrap :global(.tooltip-root) {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }

  @keyframes bubbleSpawn {
    from {
      opacity: 0;
      transform: scale(0) translateY(24px);
    }
    to {
      opacity: 0.95;
      transform: scale(1) translateY(0);
    }
  }

  /* Скролл вниз: всплытие — позиция из JS (offscreen→target), тут только scale/fade */
  @keyframes bubbleRise {
    from {
      opacity: 0;
      transform: scale(0.45);
    }
    to {
      opacity: 0.95;
      transform: scale(1);
    }
  }

  /* Скролл вверх: падение — гравитация в timing, позиция из JS */
  @keyframes bubbleFall {
    from {
      opacity: 0;
      transform: scale(0.55);
    }
    to {
      opacity: 0.95;
      transform: scale(1);
    }
  }

  .bubbleDot {
    --hue: 200;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-sizing: border-box;
    text-decoration: none;
    background: radial-gradient(
      circle at 30% 25%,
      hsl(var(--hue), 70%, 72%),
      hsl(var(--hue), 75%, 42%) 62%,
      hsl(var(--hue), 80%, 28%)
    );
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
    animation: bubbleSpawn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
  }
  .bubbleDot.enter-rise {
    animation-name: bubbleRise;
    animation-duration: 0.72s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  .bubbleDot.enter-fall {
    animation-name: bubbleFall;
    animation-duration: 0.58s;
    /* ease-in → ощущение гравитации */
    animation-timing-function: cubic-bezier(0.4, 0.05, 0.7, 1);
  }
  .bubbleDot.dragging {
    cursor: grabbing;
    filter: brightness(1.1);
    z-index: 2;
  }
  .bubbleWrap.dragging,
  .bubbleWrap.inflating {
    z-index: 5;
  }
  .bubbleWrap.popping {
    z-index: 6;
  }
  .bubbleDot.inflating {
    filter: brightness(1.12);
  }
  /* Во время лопания прячем контент — виден BubblePop */
  .bubbleDot.popping {
    background: transparent;
    box-shadow: none;
    animation: none;
  }
  .bubbleDot.popping > :not(.popLayer) {
    visibility: hidden;
  }
  .popLayer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .bubbleDot.child {
    --hue: 165;
  }
  .bubbleDot.groupable {
    --hue: 280;
  }
  /* Сессия вкладок — тёплый teal, отличается от history/group */
  .bubbleDot.session {
    --hue: 175;
  }
  .bubbleDot.session.groupable {
    --hue: 175;
  }
  .bubbleDot.overflow {
    --hue: 320;
  }
  /* Закладка: золотой шар (вместо звезды под фавиконом) */
  .bubbleDot.bookmark {
    --hue: 42;
  }
  .bubbleDot.bookmark.groupable {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0 0 2px hsl(42, 85%, 55%),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
  }
  .bubbleDot.bookmark .bubbleDot__groupRing {
    border-color: hsla(42, 90%, 65%, 0.65);
  }
  .bubbleDot.expanded {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0 0 3px hsla(var(--hue), 90%, 70%, 0.45),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
  }
  .bubbleDot:hover {
    filter: brightness(1.08);
  }
  .bubbleDot__shine {
    position: absolute;
    top: 12%;
    left: 14%;
    width: 55%;
    height: 35%;
    border-radius: 50%;
    /* Белый блик (не жёлтый) */
    background: radial-gradient(
      circle at top,
      rgba(255, 255, 255, 0.65),
      rgba(255, 255, 255, 0) 70%
    );
    pointer-events: none;
  }
  .bubbleDot__groupRing {
    position: absolute;
    inset: 6%;
    border-radius: 50%;
    border: 2px solid hsla(280, 90%, 75%, 0.55);
    pointer-events: none;
  }
  .bubbleDot.session .bubbleDot__groupRing {
    border-color: hsla(175, 90%, 70%, 0.6);
  }
  .bubbleDot__faviconWrap {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .bubbleDot__favicon {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    object-fit: contain;
    border-radius: 3px;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
    z-index: 1;
  }
  .bubbleDot__overflowBadge {
    position: absolute;
    right: 8%;
    bottom: 10%;
    min-width: 1.35rem;
    padding: 0 4px;
    border-radius: 999px;
    background: rgba(20, 12, 28, 0.85);
    color: #f8e8ff;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.35rem;
    text-align: center;
    pointer-events: none;
    z-index: 2;
  }
  /* Действия на fixed-слое (как tooltip) — над полем с overflow:hidden */
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
