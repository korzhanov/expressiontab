<script lang="ts">
  /**
   * Bubble-режим: d3-force поле + viewport cull (защита new-tab при 1000+).
   * Lined не затрагиваем — его рендерит VirtualScroll снаружи.
   */
  import { onDestroy, onMount } from "svelte";
  import type { BookmarkNode, HostGroup } from "./bookmarks";
  import {
    buildHostBubbles,
    collapseHost,
    createBubbleWorld,
    expandHost,
    isHostExpanded,
    resizeWorld,
    clampBubblesToWorld,
    stopWorld,
    visibleBubbles,
    worldHeightForCount,
    type BubbleNode,
    type BubbleWorld,
  } from "./bubble-physics";
  import BubbleDot from "./BubbleDot.svelte";

  export let bookmarkList: Map<string, HostGroup> = new Map();
  export let nodesList: BookmarkNode[] = [];
  export let width: number = 800;

  let fieldEl: HTMLElement;
  let world: BubbleWorld | null = null;
  let worldH = 560;
  let viewH =
    typeof window !== "undefined" ? window.innerHeight : 800;
  /** Кадр симуляции — будит Svelte без remount */
  let frame = 0;
  let visible: BubbleNode[] = [];
  let expandedHosts: Record<string, boolean> = {};
  let builtKey = "";

  /** scrollY в координатах поля (0 = верх section.bubbleField) */
  function fieldScrollY(): number {
    if (!fieldEl || typeof window === "undefined") return 0;
    const top = fieldEl.getBoundingClientRect().top + window.scrollY;
    return (window.scrollY || 0) - top;
  }

  function rebuild() {
    stopWorld(world);
    const w = Math.max(width || 800, 320);
    worldH = worldHeightForCount(bookmarkList.size, w);
    const nodes = buildHostBubbles({
      bookmarkList,
      nodesList,
      width: w,
      height: worldH,
    });
    world = createBubbleWorld({ nodes, width: w, height: worldH });
    expandedHosts = {};
    world.simulation.on("tick", onTick);
    refreshVisible();
  }

  function onTick() {
    if (world) clampBubblesToWorld(world.nodes, world.width, world.height);
    frame += 1;
    if (frame % 2 === 0) refreshVisible();
  }

  function refreshVisible() {
    if (!world) {
      visible = [];
      return;
    }
    visible = visibleBubbles({
      nodes: world.nodes,
      scrollY: fieldScrollY(),
      viewH,
    });
  }

  function onScroll() {
    refreshVisible();
  }

  function onResize() {
    viewH = window.innerHeight;
    if (world) {
      const w = Math.max(width || window.innerWidth, 320);
      worldH = worldHeightForCount(bookmarkList.size, w);
      resizeWorld(world, w, worldH);
    }
    refreshVisible();
  }

  function toggleExpand(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;

    if (isHostExpanded(world, b.host)) {
      collapseHost(world, b.host);
      expandedHosts[b.host] = false;
    } else {
      expandHost({
        world,
        host: b.host,
        childIndexes: group.nodes.slice(1),
        nodesList,
        maxChildren: 24,
      });
      expandedHosts[b.host] = true;
    }
    expandedHosts = { ...expandedHosts };
    refreshVisible();
  }

  $: {
    const key = `${bookmarkList.size}:${nodesList.length}:${width | 0}`;
    if (bookmarkList.size && key !== builtKey) {
      builtKey = key;
      rebuild();
    }
  }

  onMount(() => {
    refreshVisible();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
  });

  onDestroy(() => {
    stopWorld(world);
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    }
  });
</script>

<section
  class="bubbleField"
  bind:this={fieldEl}
  style="height: {worldH}px;"
  aria-label="Bubble dial"
>
  {#each visible as b (b.id)}
    <BubbleDot
      bubble={b}
      frame={frame}
      expandable={b.kind === "host" && (bookmarkList.get(b.host)?.nodes.length || 0) > 1}
      expanded={!!expandedHosts[b.host] && b.kind === "host"}
      onToggleExpand={toggleExpand}
    />
  {/each}
</section>

<style>
  .bubbleField {
    position: relative;
    width: 100%;
    min-height: 560px;
    overflow: hidden; /* не пускаем шары на часы / filter bar */
    background: radial-gradient(
      ellipse at 50% 18%,
      rgba(40, 70, 110, 0.35),
      transparent 55%
    );
  }
</style>
