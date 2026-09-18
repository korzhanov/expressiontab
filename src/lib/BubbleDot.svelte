<script lang="ts">
  /**
   * Один пузырёк в BubbleField — позиция из d3-force, spawn CSS.
   */
  import globe from "../assets/Globe.svg";
  import * as Tooltip from "./components/ui/tooltip";
  import { longhover, GROUP_LONGHOVER_MS } from "./longhover";
  import { favicons } from "./stores";
  import type { BubbleEnterAnim, BubbleNode } from "./bubble-physics";

  export let bubble: BubbleNode;
  export let expanded: boolean = false;
  /** Несколько URL на хост — цвет-маркер, expand без «+» */
  export let groupable: boolean = false;
  export let onToggleExpand: (b: BubbleNode) => void = () => {};
  /** Кадр physics — пересчёт transform без remount */
  export let frame: number = 0;
  /** Тик только при drag этого пузыря (остальные не инвалидируем) */
  export let dragTick: number = 0;
  /** Пузырь сейчас тянут — grab/grabbing + без tooltip delay */
  export let dragging: boolean = false;
  /** Вход в viewport: initial / rise (скролл вниз) / fall (вверх) */
  export let enterAnim: BubbleEnterAnim = "initial";
  export let onPointerDown: (e: PointerEvent) => void = () => {};
  export let onLinkClick: (e: MouseEvent) => void = () => {};

  $: size = bubble.r * 2;
  // initial — staggered spawn; rise/fall — короткий stagger у края
  $: delay =
    enterAnim === "initial"
      ? Math.min(bubble.spawnIndex, 48) * 0.035
      : Math.min((bubble.spawnIndex % 10) * 0.025, 0.18);
  // frame | dragTick — иначе Svelte не видит мутации x/y от d3 / pin
  $: tx = frame + dragTick >= 0 ? (bubble.x || 0) - bubble.r : 0;
  $: ty = frame + dragTick >= 0 ? (bubble.y || 0) - bubble.r : 0;

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
</script>

<!-- Обёртка двигает физикой; внутренний .bubbleDot — только spawn scale -->
<div
  class="bubbleWrap"
  class:dragging
  style="transform: translate({tx}px, {ty}px); width: {size}px; height: {size}px;"
>
  <Tooltip.Root
    content={tooltipText}
    side="bottom"
    delayDuration={400}
    disabled={dragging}
  >
    <a
      class="bubbleDot"
      class:child={bubble.kind === "child"}
      class:host={bubble.kind === "host"}
      class:groupable
      class:expanded
      class:bookmark={bubble.isBookmark}
      class:dragging
      class:enter-rise={enterAnim === "rise"}
      class:enter-fall={enterAnim === "fall"}
      href={bubble.url}
      rel="noopener noreferrer"
      draggable="false"
      style="animation-delay: {delay}s;"
      use:longhover={groupable && bubble.kind === "host" && !dragging
        ? GROUP_LONGHOVER_MS
        : 86400000}
      on:longhover|preventDefault={() => {
        if (groupable && !dragging) onToggleExpand(bubble);
      }}
      on:contextmenu|preventDefault={() => {
        if (groupable) onToggleExpand(bubble);
      }}
      on:dragstart|preventDefault
      on:pointerdown={onPointerDown}
      on:click={onLinkClick}
    >
      <span class="bubbleDot__shine" />
      {#if groupable}
        <span class="bubbleDot__groupRing" aria-hidden="true" />
      {/if}
      <img
        class="bubbleDot__favicon"
        src={faviconSrc}
        alt=""
        width="16"
        height="16"
        loading="lazy"
        draggable="false"
      />
    </a>
  </Tooltip.Root>
</div>

<style lang="scss">
  .bubbleWrap {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
    pointer-events: none;
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
  .bubbleWrap.dragging {
    z-index: 5;
  }
  .bubbleDot.child {
    --hue: 165;
  }
  .bubbleDot.bookmark {
    --hue: 42;
  }
  .bubbleDot.groupable {
    --hue: 280;
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
  .bubbleDot__favicon {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 16px;
    height: 16px;
    transform: translate(-50%, -50%);
    object-fit: contain;
    border-radius: 2px;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
  }
</style>
