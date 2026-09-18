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
    expandedHostRadius,
    fieldScrollFromRectTop,
    flightPosition,
    GROUP_ABSORB_MS,
    GROUP_INFLATE_MS,
    GROUP_POP_MS,
    GROUP_SPAWN_LEAD_MS,
    GROUP_CRATER_FILL_MS,
    inflateRadius,
    isHostExpanded,
    listHostChildren,
    absorbChildrenFrame,
    shrinkHostFrame,
    startCraterFill,
    clusterRadiusFromChildRadii,
    offscreenEnterY,
    pinBubbleAt,
    reheat,
    beginDragCollisions,
    endDragCollisions,
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
  import { bubbleRadiusFromVisits } from "./bubble-radius";
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
  /** Inflate → pop → expand для groupable host */
  let inflate: {
    id: string;
    node: BubbleNode;
    r0: number;
    r1: number;
    t0: number;
    /** Длительность роста (3с hover / ~420мс по «+») */
    dur: number;
    raf: number;
    /** contextmenu / «+»: сами коммитим после роста */
    autoCommit: boolean;
  } | null = null;
  let poppingId: string | null = null;
  /** Fold: втягивание детей */
  let collapsingId: string | null = null;
  /** Fold: дети в момент лопания (id → true) */
  let poppingChildIds: Record<string, boolean> = {};
  let inflateTick = 0;
  let expandTimer: ReturnType<typeof setTimeout> | null = null;
  let shrinkRaf = 0;
  let absorbRaf = 0;
  /** Снять временную силу заполнения кратера */
  let stopCraterFill: (() => void) | null = null;

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
    // minHeight ≈ viewport под filter bar — preview не короткая «полоска»
    const minH = Math.max((viewH || 800) - 100, 480);
    // Сначала maxR → высота → spawn (не provisional с clamp-pile)
    const radii: number[] = [];
    for (const [, group] of bookmarkList) {
      if (radii.length >= BUBBLE_SIM_CAP) break;
      const n = nodesList[group.nodes[0]];
      if (!n?.url) continue;
      radii.push(
        bubbleRadiusFromVisits({
          visitCount: group.hostVisitCount || n.visitCount || 1,
        })
      );
    }
    const maxR = radii.length ? Math.max(...radii, 40) : 52;
    worldH = worldHeightForCount(radii.length || count, w, {
      avgR: maxR,
      minHeight: minH,
    });
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
    // При перетаскивании мир не трогаем — иначе ResizeObserver раздувает высоту
    if (!world || dragBubble) return;
    const w = fieldWidth();
    measuredW = w;
    const hosts = world.nodes.filter((n) => n.kind === "host");
    // Только «спокойный» радиус (groupR) — не live r после inflate/unfold
    const maxR = hosts.reduce(
      (m, n) => Math.max(m, n.groupR ?? n.baseR ?? 40),
      40
    );
    const nextH = worldHeightForCount(hosts.length || simHostCount(), w, {
      avgR: maxR,
      minHeight: Math.max((viewH || 800) - 100, 480),
    });
    // Не расширять уже построенный мир (drag / scrollbar / inflate)
    if (nextH > worldH && Math.abs(w - world.width) < 2) {
      resizeWorld(world, w, worldH);
      bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
      refreshVisible();
      return;
    }
    worldH = nextH;
    resizeWorld(world, w, worldH);
    bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
    refreshVisible();
  }

  function toggleExpand(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    if (poppingId || collapsingId) return;
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;

    if (isHostExpanded(world, b.host)) {
      // Fold: растёт и втягивает детей
      commitCollapseAbsorb(b);
      return;
    }
    // «+»: быстрый рост → spawn детей → pop → shrink к весу
    onInflateStart(b, true, 420);
  }

  /**
   * Старт роста радиуса: родитель пухнет до площади детей,
   * collide раздвигает соседей (longhover / contextmenu / «+»).
   */
  function onInflateStart(
    b: BubbleNode,
    autoCommit = false,
    durationMs = GROUP_INFLATE_MS
  ) {
    if (!world || b.kind !== "host") return;
    if (poppingId || collapsingId || (inflate && inflate.id !== b.id)) return;
    if (isHostExpanded(world, b.host)) return;
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;
    if (inflate?.id === b.id) {
      if (autoCommit) inflate.autoCommit = true;
      return;
    }
    // groupR — сложенный вес; цель inflate — эквивалент площади детей
    const r0 = b.groupR ?? b.baseR ?? b.r;
    b.groupR = r0;
    b.baseR = r0;
    // Реальные радиусы детей (не avg) — точнее под collide
    const childRadii = group.nodes
      .slice(1, 25)
      .map((idx) =>
        bubbleRadiusFromVisits({
          visitCount: nodesList[idx]?.visitCount || 1,
        })
      );
    const r1 =
      childRadii.length > 0
        ? clusterRadiusFromChildRadii({ childRadii, r0 })
        : expandedHostRadius(r0, Math.min(group.nodes.length - 1, 24));
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    inflate = {
      id: b.id,
      node: b,
      r0,
      r1,
      t0: now,
      dur: durationMs,
      raf: 0,
      autoCommit,
    };
    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
    // Сразу подогреть collide — соседи начинают уступать место
    reheat(world, 0.55);
    ensureInflateLoop();
  }

  function ensureInflateLoop() {
    if (!inflate) return;
    if (inflate.raf) return;
    if (typeof requestAnimationFrame === "undefined") return;
    const loop = () => {
      if (!inflate) return;
      inflate.raf = 0;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const dur = inflate.dur || GROUP_INFLATE_MS;
      const u = Math.min(1, (now - inflate.t0) / dur);
      // Рост r → forceCollide читает живой radius и толкает соседей
      inflate.node.r = inflateRadius(inflate.r0, inflate.r1, u);
      inflateTick += 1;
      // Не каждый кадр: иначе alpha не падает и поле «кипит»
      if (world && inflateTick % 3 === 0) reheat(world, 0.28);
      if (u >= 1) {
        inflate.node.r = inflate.r1;
        if (inflate.autoCommit) {
          const node = inflate.node;
          inflate = null;
          commitExpandPop(node);
          return;
        }
        // Ждём longhover commit — радиус уже на максимуме, место раздвинуто
        return;
      }
      inflate.raf = requestAnimationFrame(loop);
    };
    inflate.raf = requestAnimationFrame(loop);
  }

  function onInflateCancel(b: BubbleNode) {
    if (!inflate || inflate.id !== b.id) return;
    if (inflate.autoCommit) return; // contextmenu-цепочку не рвём leave'ом
    if (inflate.raf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(inflate.raf);
    }
    inflate.node.r = inflate.r0;
    if (world) unpinBubble(inflate.node);
    inflate = null;
    inflateTick += 1;
  }

  /** Longhover дошёл до 3с → лопание и expand. */
  function onExpandCommit(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    if (isHostExpanded(world, b.host)) {
      toggleExpand(b);
      return;
    }
    if (poppingId) return;
    if (inflate && inflate.id === b.id) {
      if (inflate.raf && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(inflate.raf);
      }
      inflate.node.r = inflate.r1;
      const node = inflate.node;
      inflate = null;
      commitExpandPop(node);
      return;
    }
    // Не было inflate — полный цикл 3с + pop
    onInflateStart(b, true);
  }

  /** Contextmenu: inflate 3с → pop → expand. */
  function onExpandRequest(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    if (isHostExpanded(world, b.host)) {
      toggleExpand(b);
      return;
    }
    onInflateStart(b, true);
  }

  /** Spawn детей → пауза → pop + shrink родителя к linkR (вес своей ссылки). */
  function commitExpandPop(b: BubbleNode) {
    if (!world || poppingId || collapsingId) return;
    const group = bookmarkList.get(b.host);
    if (group && group.nodes.length > 1 && !isHostExpanded(world, b.host)) {
      // 1) Дети раньше лопания (под родителем — expandHost)
      expandHost({
        world,
        host: b.host,
        childIndexes: group.nodes.slice(1),
        nodesList,
        maxChildren: 24,
      });
      expandedHosts[b.host] = true;
      expandedHosts = { ...expandedHosts };
      refreshVisible();
    }
    if (expandTimer) clearTimeout(expandTimer);
    // 2) Через LEAD_MS — лопание и сжатие к весу своей ссылки
    expandTimer = setTimeout(() => {
      expandTimer = null;
      if (!world) return;
      const rExpanded = b.r;
      // linkR = primary visitCount, не сумма группы
      const rLink =
        b.linkR ??
        bubbleRadiusFromVisits({
          visitCount: nodesList[b.nodeIndex]?.visitCount || 1,
        });
      b.linkR = rLink;
      poppingId = b.id;
      inflateTick += 1;
      startShrinkToWeight(b, rExpanded, rLink);
      expandTimer = setTimeout(() => {
        expandTimer = null;
        if (!world) return;
        b.r = rLink;
        unpinBubble(b);
        poppingId = null;
        inflateTick += 1;
        // Стянуть детей/соседей в дыру после inflate
        stopCraterFill?.();
        stopCraterFill = startCraterFill({ world, parent: b });
        refreshVisible();
      }, GROUP_POP_MS);
    }, GROUP_SPAWN_LEAD_MS);
  }

  /** Во время pop родитель уменьшается до размера по весу. */
  function startShrinkToWeight(b: BubbleNode, r0: number, r1: number) {
    if (shrinkRaf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(shrinkRaf);
    }
    if (typeof requestAnimationFrame === "undefined") {
      b.r = r1;
      return;
    }
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const loop = () => {
      shrinkRaf = 0;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const u = Math.min(1, (now - t0) / GROUP_POP_MS);
      shrinkHostFrame({ parent: b, r0, r1, u });
      inflateTick += 1;
      // Пока r падает — links/collide подтягивают кольцо
      if (world && inflateTick % 2 === 0) reheat(world, 0.55);
      if (u < 1) {
        shrinkRaf = requestAnimationFrame(loop);
      }
    };
    shrinkRaf = requestAnimationFrame(loop);
  }

  /** Fold: рост → втягивание → pop детей → groupR. */
  function commitCollapseAbsorb(b: BubbleNode) {
    if (!world || collapsingId || poppingId) return;
    // Кратер-fill мешает absorb — снимаем
    stopCraterFill?.();
    stopCraterFill = null;
    const children = listHostChildren(world, b.host);
    if (!children.length) {
      collapseHost(world, b.host);
      expandedHosts[b.host] = false;
      expandedHosts = { ...expandedHosts };
      refreshVisible();
      return;
    }
    collapsingId = b.id;
    // Текущий r — linkR (разложенный покой); цель роста — cluster
    const r0 = b.r;
    const groupR = b.groupR ?? b.baseR ?? r0;
    b.groupR = groupR;
    const childRadii = children.map((c) => c.baseR ?? c.r);
    const r1 = clusterRadiusFromChildRadii({ childRadii, r0: groupR });
    // Снапшот стартовых позиций детей для стабильного lerp
    const starts = children.map((c) => ({
      node: c,
      x: c.x ?? 0,
      y: c.y ?? 0,
      r: c.baseR ?? c.r,
    }));
    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
    for (const c of children) {
      pinBubbleAt(c, c.x ?? 0, c.y ?? 0, world.width, world.height);
    }
    if (absorbRaf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(absorbRaf);
    }
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const loop = () => {
      absorbRaf = 0;
      if (!world) return;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const u = Math.min(1, (now - t0) / GROUP_ABSORB_MS);
      absorbChildrenFrame({ parent: b, starts, r0, r1, u });
      for (const s of starts) {
        pinBubbleAt(s.node, s.node.x ?? 0, s.node.y ?? 0, world.width, world.height);
      }
      pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
      inflateTick += 1;
      if (u < 1) {
        absorbRaf = requestAnimationFrame(loop);
        return;
      }
      // Финал absorb: лопание детей, затем collapse → groupR
      const nextPop: Record<string, boolean> = {};
      for (const c of children) nextPop[c.id] = true;
      poppingChildIds = nextPop;
      inflateTick += 1;
      if (expandTimer) clearTimeout(expandTimer);
      expandTimer = setTimeout(() => {
        expandTimer = null;
        if (!world) return;
        for (const c of children) unpinBubble(c);
        collapseHost(world, b.host);
        b.r = groupR;
        b.baseR = groupR;
        unpinBubble(b);
        poppingChildIds = {};
        collapsingId = null;
        expandedHosts[b.host] = false;
        expandedHosts = { ...expandedHosts };
        reheat(world, 0.5);
        inflateTick += 1;
        refreshVisible();
      }, GROUP_POP_MS);
    };
    if (typeof requestAnimationFrame === "undefined") {
      collapseHost(world, b.host);
      collapsingId = null;
      expandedHosts[b.host] = false;
      expandedHosts = { ...expandedHosts };
      refreshVisible();
      return;
    }
    absorbRaf = requestAnimationFrame(loop);
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
      // Как drag-collisions: alphaTarget(0.3) — соседи отпружинивают от fx/fy
      beginDragCollisions(world);
    }
    if (!dragMoved) return;
    const pt = fieldPointFromClient(e.clientX, e.clientY);
    pinBubbleAt(dragBubble, pt.x, pt.y, world.width, world.height);
    // Тик поля — остальные шары тоже двигаются (collide)
    frame += 1;
    dragTick += 1;
    e.preventDefault();
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!dragBubble) return;
    if (world) {
      unpinBubble(dragBubble);
      // alphaTarget(0) — симуляция остывает, collide дорешает
      endDragCollisions(world);
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
    // Drag отменяет hover-inflate (кроме contextmenu autoCommit)
    if (inflate?.id === b.id && !inflate.autoCommit) {
      onInflateCancel(b);
    }
    dragBubble = b;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragMoved = false;
    // Сразу fx/fy — collide видит pinned субъект (как drag-collisions subject)
    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
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
    if (inflate?.raf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(inflate.raf);
    }
    if (expandTimer) clearTimeout(expandTimer);
    if (shrinkRaf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(shrinkRaf);
    }
    if (absorbRaf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(absorbRaf);
    }
    stopCraterFill?.();
    stopCraterFill = null;
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
      inflateTick={inflate?.id === b.id ||
      poppingId === b.id ||
      collapsingId === b.id ||
      !!poppingChildIds[b.id] ||
      (collapsingId != null && b.parentId === collapsingId)
        ? inflateTick
        : 0}
      dragging={dragBubble?.id === b.id}
      inflating={inflate?.id === b.id}
      popping={poppingId === b.id || !!poppingChildIds[b.id]}
      enterAnim={enterAnimById[b.id] || "initial"}
      groupable={b.kind === "host" && (bookmarkList.get(b.host)?.nodes.length || 0) > 1}
      expanded={!!expandedHosts[b.host] && b.kind === "host"}
      onInflateStart={() => onInflateStart(b, false)}
      onInflateCancel={() => onInflateCancel(b)}
      onExpandCommit={() => onExpandCommit(b)}
      onExpandRequest={() => onExpandRequest(b)}
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
