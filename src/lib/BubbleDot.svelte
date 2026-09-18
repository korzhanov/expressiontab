<script lang="ts">
  /**
   * Один пузырёк в BubbleField — позиция из d3-force, spawn CSS.
   */
  import * as Tooltip from "./components/ui/tooltip";
  import type { BubbleNode } from "./bubble-physics";

  export let bubble: BubbleNode;
  export let expanded: boolean = false;
  export let expandable: boolean = false;
  export let onToggleExpand: (b: BubbleNode) => void = () => {};
  /** Кадр physics — пересчёт transform без remount */
  export let frame: number = 0;

  $: size = bubble.r * 2;
  $: delay = Math.min(bubble.spawnIndex, 48) * 0.035;
  // frame в зависимости — иначе Svelte не видит мутации x/y от d3
  $: tx = frame >= 0 ? (bubble.x || 0) - bubble.r : 0;
  $: ty = frame >= 0 ? (bubble.y || 0) - bubble.r : 0;
</script>

<!-- Обёртка двигает физикой; внутренний .bubbleDot — только spawn scale -->
<div
  class="bubbleWrap"
  style="transform: translate({tx}px, {ty}px); width: {size}px; height: {size}px;"
>
  <Tooltip.Root content={bubble.title} side="bottom" delayDuration={400}>
    <a
      class="bubbleDot"
      class:child={bubble.kind === "child"}
      class:host={bubble.kind === "host"}
      class:expanded
      class:bookmark={bubble.isBookmark}
      href={bubble.url}
      rel="noopener noreferrer"
      style="animation-delay: {delay}s;"
      on:contextmenu|preventDefault={() => {
        if (expandable) onToggleExpand(bubble);
      }}
    >
      <span class="bubbleDot__shine" />
      {#if expandable}
        <button
          type="button"
          class="bubbleDot__expand"
          aria-label={expanded ? "Collapse group" : "Expand group"}
          aria-expanded={expanded}
          on:click|preventDefault|stopPropagation={() => onToggleExpand(bubble)}
        >
          {expanded ? "−" : "+"}
        </button>
      {/if}
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

  /* Появление: мотив cassierossall — scale(0) → 1 */
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
    cursor: pointer;
  }
  .bubbleDot.child {
    --hue: 165;
  }
  .bubbleDot.bookmark {
    --hue: 42;
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
  .bubbleDot__expand {
    position: absolute;
    right: 4%;
    bottom: 4%;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(20, 20, 20, 0.55);
    color: #fff;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
    display: grid;
    place-items: center;
  }
  .bubbleDot__expand:hover {
    background: rgba(20, 20, 20, 0.8);
  }
</style>
