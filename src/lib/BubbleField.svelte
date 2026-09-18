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
    ENTER_FALL_MS,
    ENTER_RISE_MS,
    expandHost,
    fieldScrollFromRectTop,
    flightPosition,
    isHostExpanded,
    offscreenEnterY,
    pinBubbleAt,
    reheat,
    resizeWorld,
    scrollDirection,
    separateBubbles,
    stopWorld,
    unpinBubble,
    visibleBubbles,
    worldHeightForCount,
    type BubbleEnterAnim,
    type BubbleEnterFlight,
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
  /** Полёты из-за экрана → разведённые конечные точки */
  let flights = new Map<string, BubbleEnterFlight>();
  let flightRaf = 0;

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
    flights = new Map();
    lastFieldScrollY = fieldScrollY();
    world.simulation.on("tick", onTick);
    refreshVisible();
  }

  /** Старт полётов: offscreen → separate targets → pin на траектории. */
  function startEnterFlights(
    newcomers: BubbleNode[],
    anims: Record<string, BubbleEnterAnim>,
    scrollY: number
  ) {
    if (!world || !newcomers.length) return;
    const newIds = new Set(newcomers.map((n) => n.id));
    const locked = visible
      .filter((n) => !newIds.has(n.id))
      .map((n) => ({
        id: n.id,
        x: n.x ?? 0,
        y: n.y ?? 0,
        r: n.r || 40,
        locked: true as const,
      }));
    const movable = newcomers.map((n) => ({
      id: n.id,
      x: n.x ?? world!.width / 2,
      y: n.y ?? scrollY + viewH / 2,
      r: n.r || 40,
      locked: false as const,
    }));
    // Конечные координаты без наложений (новички двигаются, старые — якоря)
    separateBubbles([...locked, ...movable], {
      width: world.width,
      height: world.height,
    });
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const m of movable) {
      if (flights.has(m.id)) continue;
      const anim = anims[m.id];
      if (anim !== "rise" && anim !== "fall") continue;
      const node = world.nodes.find((n) => n.id === m.id);
      if (!node) continue;
      const y0 = offscreenEnterY({
        anim,
        scrollY,
        viewH,
        r: m.r,
      });
      const x0 = m.x;
      const flight: BubbleEnterFlight = {
        id: m.id,
        anim,
        x0,
        y0,
        x1: m.x,
        y1: m.y,
        t0: now,
        dur: anim === "fall" ? ENTER_FALL_MS : ENTER_RISE_MS,
      };
      flights.set(m.id, flight);
      pinBubbleAt(node, x0, y0, world.width, world.height);
    }
    ensureFlightLoop();
  }

  /** rAF пока есть полёты — даже если d3 alpha остыл. */
  function ensureFlightLoop() {
    if (flightRaf || typeof requestAnimationFrame === "undefined") return;
    const loop = () => {
      flightRaf = 0;
      if (!flights.size) return;
      advanceFlights();
      flightRaf = requestAnimationFrame(loop);
    };
    flightRaf = requestAnimationFrame(loop);
  }

  /** Продвинуть полёты; по завершении — unpin на конечной точке. */
  function advanceFlights() {
    if (!flights.size || !world) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    let finished = false;
    for (const [id, f] of [...flights]) {
      const node = world.nodes.find((n) => n.id === id);
      if (!node) {
        flights.delete(id);
        continue;
      }
      const u = Math.min(1, (now - f.t0) / f.dur);
      const pt = flightPosition(f, u);
      pinBubbleAt(node, pt.x, pt.y, world.width, world.height);
      if (u >= 1) {
        node.x = f.x1;
        node.y = f.y1;
        unpinBubble(node);
        flights.delete(id);
        finished = true;
      }
    }
    frame += 1;
    if (finished && !flights.size) {
      reheat(world, 0.2);
    }
  }

  function onTick() {
    // Во время активного drag симуляцию не крутим — иначе все шары дёргаются
    if (dragMoved && dragBubble) return;
    // Полёты крутит rAF (ensureFlightLoop) — не ускоряем тут вдвое
    if (flights.size) return;
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
      // Не снимать DOM с пузыря в drag / полёте — иначе потеряем capture / анимацию
      pinnedId: dragBubble?.id ?? null,
    });
    const nextIds = next.map((n) => n.id);
    const anims = assignEnterAnims({
      prevIds: prevVisibleIds,
      nextIds,
      scrollDir: dir,
      prevAnims: enterAnimById,
    });
    const newcomers = next.filter((n) => {
      if (prevVisibleIds.has(n.id) || flights.has(n.id)) return false;
      const a = anims[n.id];
      return a === "rise" || a === "fall";
    });
    if (newcomers.length) {
      startEnterFlights(newcomers, anims, sy);
    }
    enterAnimById = anims;
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
    if (flightRaf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(flightRaf);
      flightRaf = 0;
    }
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
