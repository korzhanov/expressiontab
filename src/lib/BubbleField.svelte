<script lang="ts">
  /**
   * Bubble-режим: d3-force поле + viewport cull (защита new-tab при 1000+).
   * Lined не затрагиваем — его рендерит VirtualScroll снаружи.
   */
  import { onDestroy, onMount } from "svelte";
  import type { BookmarkNode, HostGroup } from "./bookmarks";
  import {
    assignEnterAnims,
    buildHostBubbles,
    bounceBubblesAtWorldEdges,
    BUBBLE_SIM_CAP,
    clientToFieldPoint,
    collapseHost,
    createBubbleWorld,
    expandHost,
    fieldScrollFromRectTop,
    isHostExpanded,
    pinBubbleAt,
    reheat,
    resizeWorld,
    scrollDirection,
    stopWorld,
    unpinBubble,
    visibleBubbles,
    worldHeightForCount,
    type BubbleEnterAnim,
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
  /** Кадр симуляции — будит Svelte без remount (все пузыри) */
  let frame = 0;
  /** Локальный тик только для тянутого пузыря — без перерисовки остальных */
  let dragTick = 0;
  let visible: BubbleNode[] = [];
  let expandedHosts: Record<string, boolean> = {};
  let builtKey = "";
  /** Предыдущий scrollY поля — направление rise/fall */
  let lastFieldScrollY = 0;
  let prevVisibleIds = new Set<string>();
  let enterAnimById: Record<string, BubbleEnterAnim> = {};

  /** Drag: pinBubbleAt (fx/fy); после порога не открываем ссылку */
  let dragBubble: BubbleNode | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let dragListenersOn = false;
  const DRAG_THRESHOLD_PX = 6;
  /** Реальная ширина поля (не window) — иначе правый край «протекает» из‑за scrollbar */
  let measuredW = 0;
  let resizeObs: ResizeObserver | null = null;

  /** scrollY в координатах поля (0 = верх section.bubbleField) */
  function fieldScrollY(): number {
    if (!fieldEl) return 0;
    return fieldScrollFromRectTop(fieldEl.getBoundingClientRect().top);
  }

  /** Ширина мира = clientWidth .bubbleField (симметрия L/R границ). */
  function fieldWidth(): number {
    const fromDom = fieldEl?.clientWidth || measuredW;
    return Math.max(fromDom || width || 800, 320);
  }

  function simHostCount(): number {
    return Math.min(bookmarkList.size, BUBBLE_SIM_CAP);
  }

  function rebuild() {
    stopWorld(world);
    const w = fieldWidth();
    measuredW = w;
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
    // Сброс enter-анимаций при новой симуляции
    prevVisibleIds = new Set();
    enterAnimById = {};
    lastFieldScrollY = fieldScrollY();
    world.simulation.on("tick", onTick);
    refreshVisible();
  }

  function onTick() {
    // Во время активного drag симуляцию не крутим — иначе все шары дёргаются
    if (dragMoved && dragBubble) return;
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
    const sy = fieldScrollY();
    const dir = scrollDirection(lastFieldScrollY, sy);
    lastFieldScrollY = sy;
    const next = visibleBubbles({
      nodes: world.nodes,
      scrollY: sy,
      viewH,
      // Не снимать DOM с пузыря в drag — иначе потеряем capture
      pinnedId: dragBubble?.id ?? null,
    });
    const nextIds = next.map((n) => n.id);
    enterAnimById = assignEnterAnims({
      prevIds: prevVisibleIds,
      nextIds,
      scrollDir: dir,
      prevAnims: enterAnimById,
    });
    prevVisibleIds = new Set(nextIds);
    visible = next;
  }

  function onScroll() {
    refreshVisible();
  }

  function onResize() {
    viewH = window.innerHeight;
    if (world) {
      const w = fieldWidth();
      measuredW = w;
      worldH = worldHeightForCount(simHostCount(), w);
      resizeWorld(world, w, worldH);
      // После сужения поля — сразу прижать к новым краям
      bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
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
    return clientToFieldPoint({
      clientX,
      clientY,
      fieldLeft: rect.left,
      fieldTop: rect.top,
    });
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
      // Заморозить физику: без reheat — остальные шары стоят
      world.simulation.alpha(0).stop();
    }
    if (!dragMoved) return;
    const pt = fieldPointFromClient(e.clientX, e.clientY);
    pinBubbleAt(dragBubble, pt.x, pt.y, world.width, world.height);
    // Только тянутый пузырь: не трогаем глобальный frame
    dragTick += 1;
    e.preventDefault();
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!dragBubble) return;
    if (world) {
      unpinBubble(dragBubble);
      // Лёгкий reheat только после отпускания
      reheat(world, 0.25);
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
    const key = `${bookmarkList.size}:${nodesList.length}`;
    if (bookmarkList.size && key !== builtKey) {
      builtKey = key;
      rebuild();
    }
  }

  onMount(() => {
    measuredW = fieldEl?.clientWidth || width || 800;
    refreshVisible();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // clientWidth поля (scrollbar / padding) — не window.innerWidth
    if (typeof ResizeObserver !== "undefined" && fieldEl) {
      resizeObs = new ResizeObserver(() => onResize());
      resizeObs.observe(fieldEl);
    }
  });

  onDestroy(() => {
    detachDragListeners();
    resizeObs?.disconnect();
    resizeObs = null;
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
      dragTick={dragBubble?.id === b.id ? dragTick : 0}
      dragging={dragBubble?.id === b.id}
      enterAnim={enterAnimById[b.id] || "initial"}
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
