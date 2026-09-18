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
    bounceBubblesAtWorldEdges,
    pinBubbleAt,
    reheat,
    stopWorld,
    unpinBubble,
    visibleBubbles,
    worldHeightForCount,
    BUBBLE_SIM_CAP,
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

  /** Drag: pinBubbleAt (fx/fy); после порога не открываем ссылку */
  let dragBubble: BubbleNode | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let dragListenersOn = false;
  const DRAG_THRESHOLD_PX = 6;

  /** scrollY в координатах поля (0 = верх section.bubbleField) */
  function fieldScrollY(): number {
    if (!fieldEl || typeof window === "undefined") return 0;
    const top = fieldEl.getBoundingClientRect().top + window.scrollY;
    return (window.scrollY || 0) - top;
  }

  function simHostCount(): number {
    return Math.min(bookmarkList.size, BUBBLE_SIM_CAP);
  }

  function rebuild() {
    stopWorld(world);
    const w = Math.max(width || 800, 320);
    const count = simHostCount();
    worldH = worldHeightForCount(count, w);
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
    if (world) {
      bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
    }
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
      // Не снимать DOM с пузыря в drag — иначе потеряем capture
      pinnedId: dragBubble?.id ?? null,
    });
  }

  function onScroll() {
    refreshVisible();
  }

  function onResize() {
    viewH = window.innerHeight;
    if (world) {
      const w = Math.max(width || window.innerWidth, 320);
      worldH = worldHeightForCount(simHostCount(), w);
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

  function fieldPointFromClient(clientX: number, clientY: number): {
    x: number;
    y: number;
  } {
    if (!fieldEl) return { x: clientX, y: clientY };
    const rect = fieldEl.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top + fieldScrollY(),
    };
  }

  function detachDragListeners() {
    if (!dragListenersOn || typeof window === "undefined") return;
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
    window.removeEventListener("pointercancel", onWindowPointerUp);
    dragListenersOn = false;
  }

  function attachDragListeners() {
    if (dragListenersOn || typeof window === "undefined") return;
    // На window — надёжнее, чем только capture на <a> (native link-drag / cull)
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
    dragListenersOn = true;
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (!dragBubble || !world) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!dragMoved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      dragMoved = true;
    }
    if (!dragMoved) return;
    const pt = fieldPointFromClient(e.clientX, e.clientY);
    pinBubbleAt(dragBubble, pt.x, pt.y, world.width, world.height);
    reheat(world, 0.4);
    frame += 1;
    e.preventDefault();
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!dragBubble) return;
    if (world) {
      unpinBubble(dragBubble);
      reheat(world, 0.3);
    }
    detachDragListeners();
    dragBubble = null;
    // dragMoved сбрасываем в click — чтобы отменить переход по href
    if (dragMoved) e.preventDefault();
    refreshVisible();
  }

  function onBubblePointerDown(b: BubbleNode, e: PointerEvent) {
    if (e.button !== 0 || !world) return;
    // Блокируем native HTML5-drag ссылки (иначе пузырь «не едет»)
    e.preventDefault();
    dragBubble = b;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragMoved = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    attachDragListeners();
  }

  function onBubbleClick(e: MouseEvent) {
    if (dragMoved) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved = false;
    }
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
    detachDragListeners();
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
      dragging={dragBubble?.id === b.id}
      groupable={b.kind === "host" && (bookmarkList.get(b.host)?.nodes.length || 0) > 1}
      expanded={!!expandedHosts[b.host] && b.kind === "host"}
      onToggleExpand={toggleExpand}
      onPointerDown={(e) => onBubblePointerDown(b, e)}
      onLinkClick={onBubbleClick}
    />
  {/each}
</section>

<style>
  .bubbleField {
    position: relative;
    width: 100%;
    min-height: 560px;
    overflow: hidden; /* не пускаем шары на часы / filter bar */
    /* Без цветного radial — только нейтральный слой поверх anchores; hero-картинка цветная */
    background: transparent;
  }
</style>
