<script lang="ts">
  /**
   * Один пузырёк в BubbleField — позиция из d3-force, spawn CSS.
   * Groupable: inflate 3с → BubblePop → expand.
   * ПКМ / hover: Bookmark, Copy, Delete.
   */
  import Icon, { Star, Trash, Duplicate } from "svelte-hero-icons";
  import { fade } from "svelte/transition";
  import globe from "../assets/Globe.svg";
  import BubblePop from "./BubblePop.svelte";
  import * as Tooltip from "./components/ui/tooltip";
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
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let localBookmark = !!bubble.isBookmark;
  $: localBookmark = !!bubble.isBookmark;

  function showMenu() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    multiButton = true;
  }

  function openMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Shift+ПКМ — expand (как раньше чистый contextmenu)
    if (e.shiftKey && groupable) {
      onExpandRequest();
      return;
    }
    showMenu();
  }

  function scheduleCloseMenu() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      multiButton = false;
    }, 280);
  }

  function keepMenuOpen() {
    if (!multiButton) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  async function copyToBuffer(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bubble.url);
    } catch (err) {
      console.error(err);
    }
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
    multiButton = false;
    onDelete();
  }
</script>

<!-- Обёртка двигает физикой; внутренний .bubbleDot — spawn / pop -->
<div
  class="bubbleWrap"
  class:host={bubble.kind === "host"}
  class:child={bubble.kind === "child"}
  class:dragging
  class:inflating
  class:popping
  class:menuOpen={multiButton}
  role="group"
  style="transform: translate({tx}px, {ty}px); width: {size}px; height: {size}px;"
  on:mouseleave={scheduleCloseMenu}
>
  <Tooltip.Root
    content={tooltipText}
    side="bottom"
    delayDuration={400}
    disabled={dragging || inflating || popping || multiButton}
  >
    <a
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
        showMenu();
        // expanded тоже: BubbleField решит grow vs unfold
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
      <!-- Закладка: фавикон на золотой звезде -->
      <span class="bubbleDot__faviconWrap" class:starred={localBookmark}>
        {#if localBookmark}
          <svg
            class="bubbleDot__star"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.4 6.5L12 16.8 5.9 20.3l1.4-6.5L2.4 9.3l6.6-.7L12 2.5z"
            />
          </svg>
        {/if}
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
  {#if multiButton && !dragging && !popping}
    <div
      class="multiButton"
      role="toolbar"
      aria-label="Bubble actions"
      transition:fade={{ duration: 160 }}
      on:mouseenter={keepMenuOpen}
      on:mouseleave={scheduleCloseMenu}
    >
      <Tooltip.Root content="Bookmark" side="top" delayDuration={200}>
        <button
          class:isBookmark={localBookmark}
          type="button"
          aria-label="Bookmark"
          on:click={toggleBookmark}
          on:pointerdown|stopPropagation
        >
          <Icon src={Star} solid size="18" />
        </button>
      </Tooltip.Root>
      <Tooltip.Root content="Copy url" side="top" delayDuration={200}>
        <button
          type="button"
          aria-label="Copy url"
          on:click={copyToBuffer}
          on:pointerdown|stopPropagation
        >
          <Icon src={Duplicate} solid size="18" />
        </button>
      </Tooltip.Root>
      <Tooltip.Root content="Delete" side="top" delayDuration={200}>
        <button
          type="button"
          aria-label="Delete"
          on:click={deleteBubble}
          on:pointerdown|stopPropagation
        >
          <Icon src={Trash} solid size="18" />
        </button>
      </Tooltip.Root>
    </div>
  {/if}
</div>

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
  .bubbleWrap.menuOpen {
    z-index: 40;
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
  .bubbleDot.bookmark.groupable {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0 0 2px hsl(280, 75%, 58%),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
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
  .bubbleDot__faviconWrap.starred {
    /* Чуть крупнее звезды вокруг фавикона */
    width: 44px;
    height: 44px;
  }
  .bubbleDot__star {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }
  .bubbleDot__star path {
    /* Контурная звезда: прозрачная заливка, жёлтая обводка */
    fill: transparent;
    stroke: #f0c040;
    stroke-width: 1.4;
    stroke-linejoin: round;
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
  /* На звезде фавикон чуть меньше, без второй тени */
  .bubbleDot__faviconWrap.starred .bubbleDot__favicon {
    width: 18px;
    height: 18px;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.35));
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
  /* Меню действий — дуга над пузырьком */
  .multiButton {
    z-index: 1000;
    position: absolute;
    top: 0.1rem;
    left: 50%;
    border-radius: 100%;
    width: 6.5rem;
    height: 6.5rem;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .multiButton button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 100%;
    background: #fff;
    color: #111;
    line-height: 0;
    pointer-events: auto;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }
  .multiButton button:hover {
    background: #111;
    color: #fff;
  }
  .multiButton button.isBookmark {
    background: #f0c040;
    color: #3a2a00;
  }
  .multiButton :global(.tooltip-root) {
    position: absolute;
    width: auto;
    height: auto;
    pointer-events: auto;
    transform: translate(-50%, -50%);
  }
  .multiButton :global(.tooltip-root:nth-child(1)) {
    left: 22%;
    top: 28%;
  }
  .multiButton :global(.tooltip-root:nth-child(2)) {
    left: 50%;
    top: 8%;
  }
  .multiButton :global(.tooltip-root:nth-child(3)) {
    left: 78%;
    top: 28%;
  }
</style>
