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
    expandOverflowNode,
    fieldScrollFromRectTop,
    flightPosition,
    GROUP_ABSORB_MS,
    GROUP_INFLATE_MS,
    GROUP_POP_MS,
    GROUP_SPAWN_LEAD_MS,
    GROUP_CRATER_FILL_MS,
    GROUP_CHILD_SPAWN_AT_MS,
    GROUP_CHILD_STAGGER_MS,
    GROUP_EXPANDED_HOVER_GROW_MS,
    GROUP_EXPANDED_HOVER_SHRINK_MS,
    GROUP_MAX_CHILDREN,
    inflateRadius,
    isHostExpanded,
    listHostChildren,
    absorbChildrenFrame,
    shrinkHostFrame,
    startCraterFill,
    offscreenEnterY,
    pinBubbleAt,
    reheat,
    beginDragCollisions,
    endDragCollisions,
    beginSoftRadiusAdjust,
    endSoftRadiusAdjust,
    nudgeSim,
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
  import {
    bubbleNavHue,
    navBurstPortal,
    shouldSkipNavTransition,
    viewportCoverRadius,
  } from "./bubble-nav-transition";
  import {
    MAX_UNFOLDED_HOSTS,
    noteFoldedHost,
    noteUnfoldedHost,
  } from "./unfold-limit";
  import BubbleDot from "./BubbleDot.svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

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
  /** LRU unfolded host'ов — не больше MAX_UNFOLDED_HOSTS */
  let expandedOrder: string[] = [];
  let builtKey = "";
  /** Предыдущий scrollY поля — направление rise/fall */
  let lastFieldScrollY = 0;
  let prevVisibleIds = new Set<string>();
  let enterAnimById: Record<string, BubbleEnterAnim> = {};
  /** Полёты из-за экрана → разведённые конечные точки */
  let flights = new Map<string, BubbleEnterFlight>();
  let flightRaf = 0;
  /** Inflate / hover-grow для groupable host */
  let inflate: {
    id: string;
    node: BubbleNode;
    r0: number;
    r1: number;
    t0: number;
    /** Длительность сжатия/роста */
    dur: number;
    raf: number;
    /** contextmenu / «+»: сами коммитим после роста */
    autoCommit: boolean;
    /** unfold | рост на раскрытой | откат при leave */
    mode: "unfold" | "expandedGrow" | "expandedGrowBack";
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
  /** Hover: очередь индексов детей ещё не заспавненных */
  let pendingChildIndexes: number[] = [];
  let spawnHostKey: string | null = null;
  let childSpawnDelayTimer: ReturnType<typeof setTimeout> | null = null;
  let childStaggerTimer: ReturnType<typeof setInterval> | null = null;
  let childSpawnSeq = 0;

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
    expandedOrder = [];
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
    // Полёты крутит rAF (ensureFlightLoop) — не ускоряем тут вдвое
    if (flights.size) return;
    if (world) {
      // И при drag: соседи от collide не улетают за край блока
      bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
    }
    // Drag: обновляем позиции соседей, без refreshVisible (cull не трогаем)
    if (dragMoved && dragBubble) {
      frame += 1;
      return;
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
    if (!world) return;
    if (poppingId || collapsingId) return;
    // Overflow-группа: раскрыть хвост
    if (b.isOverflowGroup && (b.overflowChildIndexes?.length || 0) > 0) {
      onInflateStart(b, true, 420);
      return;
    }
    if (b.kind !== "host") return;
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;

    if (isHostExpanded(world, b.host)) {
      // Fold: растёт и втягивает детей
      commitCollapseAbsorb(b);
      return;
    }
    // «+»: быстрое сжатие → spawn детей → pop
    onInflateStart(b, true, 420);
  }

  /**
   * Запомнить unfold; сверх лимита — мгновенно свернуть самых старых
   * (без очереди absorb-анимаций — иначе лагает).
   */
  function registerExpanded(host: string) {
    if (!host || !world) return;
    const { order, toCollapse } = noteUnfoldedHost({
      order: expandedOrder,
      host,
      max: MAX_UNFOLDED_HOSTS,
    });
    expandedOrder = order;
    for (const h of toCollapse) {
      if (isHostExpanded(world, h)) collapseHost(world, h);
      expandedHosts[h] = false;
    }
    expandedHosts[host] = true;
    expandedHosts = { ...expandedHosts };
  }

  /** Снять host из LRU при fold */
  function registerCollapsed(host: string) {
    if (!host) return;
    expandedOrder = noteFoldedHost({
      order: expandedOrder,
      host,
    }).order;
    expandedHosts[host] = false;
    expandedHosts = { ...expandedHosts };
  }

  /**
   * Unfold: родитель сжимается groupR → linkR (вес своей ссылки),
   * дети появляются рядом (longhover / contextmenu / «+»).
   */
  function onInflateStart(
    b: BubbleNode,
    autoCommit = false,
    durationMs = GROUP_INFLATE_MS
  ) {
    if (!world) return;
    if (poppingId || collapsingId || (inflate && inflate.id !== b.id)) return;

    // Overflow-шар: inflate + expandOverflowNode
    if (b.isOverflowGroup && (b.overflowChildIndexes?.length || 0) > 0) {
      if (inflate?.id === b.id) {
        if (autoCommit) inflate.autoCommit = true;
        return;
      }
      const r0 = b.r;
      const r1 = Math.max((b.linkR ?? r0) * 0.85, 28);
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
        mode: "unfold",
      };
      pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
      beginSoftRadiusAdjust(world);
      ensureInflateLoop();
      return;
    }

    if (b.kind !== "host") return;
    if (isHostExpanded(world, b.host)) return;
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;
    if (inflate?.id === b.id) {
      if (autoCommit) inflate.autoCommit = true;
      return;
    }
    // groupR — сложенный вес группы; цель — вес своей ссылки
    const r0 = b.groupR ?? b.baseR ?? b.r;
    b.groupR = r0;
    b.baseR = r0;
    const rLink =
      b.linkR ??
      bubbleRadiusFromVisits({
        visitCount: nodesList[b.nodeIndex]?.visitCount || 1,
      });
    b.linkR = rLink;
    // Уменьшаем (не растём); если linkR ≥ groupR — чуть меньше groupR
    const r1 = rLink < r0 ? rLink : Math.max(r0 * 0.72, 28);
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
      mode: "unfold",
    };
    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
    // Мягкая подстройка collide — без взрыва alpha по всему полю
    beginSoftRadiusAdjust(world);
    ensureInflateLoop();
    // Hover (не «+»/меню): дети с 2с по очереди
    if (!autoCommit) scheduleHoverChildSpawn(b);
  }

  /**
   * Уже раскрытая группа: при hover родитель медленно растёт к groupR.
   * Leave → expandedGrowBack к linkR.
   */
  function onExpandedHoverGrow(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    if (poppingId || collapsingId) return;
    if (!isHostExpanded(world, b.host)) return;
    // Уже растём / откатываемся для этого id — не рестартим с нуля
    if (inflate?.id === b.id && inflate.mode === "expandedGrow") return;
    if (inflate?.raf && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(inflate.raf);
    }
    const rLink =
      b.linkR ??
      bubbleRadiusFromVisits({
        visitCount: nodesList[b.nodeIndex]?.visitCount || 1,
      });
    b.linkR = rLink;
    const groupR = b.groupR ?? b.baseR ?? rLink;
    // Цель роста — сложенный размер; если равен linkR — чуть больше
    const r1 =
      groupR > rLink + 1 ? groupR : Math.max(rLink * 1.35, rLink + 8);
    const r0 = b.r;
    if (r1 <= r0 + 0.5) return; // уже на максимуме
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    inflate = {
      id: b.id,
      node: b,
      r0,
      r1,
      t0: now,
      dur: GROUP_EXPANDED_HOVER_GROW_MS,
      raf: 0,
      autoCommit: false,
      mode: "expandedGrow",
    };
    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
    beginSoftRadiusAdjust(world);
    ensureInflateLoop();
  }

  function clearHoverChildSpawn() {
    if (childSpawnDelayTimer) clearTimeout(childSpawnDelayTimer);
    if (childStaggerTimer) clearInterval(childStaggerTimer);
    childSpawnDelayTimer = null;
    childStaggerTimer = null;
    pendingChildIndexes = [];
    spawnHostKey = null;
    childSpawnSeq = 0;
  }

  /** С 2с hover — дети по одному; очередь живёт до leave / flush на 3с. */
  function scheduleHoverChildSpawn(b: BubbleNode) {
    clearHoverChildSpawn();
    const group = bookmarkList.get(b.host);
    if (!group || group.nodes.length < 2) return;
    pendingChildIndexes = group.nodes.slice(1); // все дети, без обрезки 24
    spawnHostKey = b.host;
    childSpawnSeq = 0;
    childSpawnDelayTimer = setTimeout(() => {
      childSpawnDelayTimer = null;
      if (!world || spawnHostKey !== b.host || inflate?.id !== b.id) return;
      const spawnOne = () => {
        if (!world || spawnHostKey !== b.host) return;
        if (!pendingChildIndexes.length) {
          if (childStaggerTimer) clearInterval(childStaggerTimer);
          childStaggerTimer = null;
          return;
        }
        // Близко к лимиту + хвост — flush (последний станет overflow-группой)
        if (
          childSpawnSeq >= GROUP_MAX_CHILDREN - 1 &&
          pendingChildIndexes.length > 1
        ) {
          flushPendingChildren(b);
          return;
        }
        const idx = pendingChildIndexes.shift()!;
        expandHost({
          world,
          host: b.host,
          childIndexes: [idx],
          nodesList,
          keepParentR: true,
          spawnIndexBase: childSpawnSeq,
          maxChildren: GROUP_MAX_CHILDREN,
        });
        childSpawnSeq += 1;
        registerExpanded(b.host);
        nudgeSim(world, 0.12);
        refreshVisible();
      };
      spawnOne();
      childStaggerTimer = setInterval(spawnOne, GROUP_CHILD_STAGGER_MS);
    }, GROUP_CHILD_SPAWN_AT_MS);
  }

  /** Высыпать оставшихся детей (3с hover / commit). */
  function flushPendingChildren(b: BubbleNode): void {
    if (!world || !pendingChildIndexes.length || spawnHostKey !== b.host) {
      clearHoverChildSpawn();
      return;
    }
    const rest = pendingChildIndexes.slice();
    const base = childSpawnSeq;
    clearHoverChildSpawn();
    expandHost({
      world,
      host: b.host,
      childIndexes: rest,
      nodesList,
      keepParentR: true,
      spawnIndexBase: base,
      maxChildren: GROUP_MAX_CHILDREN,
    });
    registerExpanded(b.host);
    nudgeSim(world, 0.18);
    refreshVisible();
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
      // Сжатие/рост r → forceCollide читает живой radius
      inflate.node.r = inflateRadius(inflate.r0, inflate.r1, u);
      inflateTick += 1;
      // Не reheat: иначе дальние хосты «пружинят» по полю
      if (world && inflateTick % 6 === 0) nudgeSim(world, 0.06);
      if (u >= 1) {
        inflate.node.r = inflate.r1;
        if (inflate.mode === "expandedGrowBack") {
          // Откат после leave — снимаем pin и остужаем
          if (world) {
            unpinBubble(inflate.node);
            endSoftRadiusAdjust(world);
          }
          inflate = null;
          inflateTick += 1;
          return;
        }
        if (inflate.mode === "expandedGrow") {
          // Держим увеличенный r, пока курсор на месте
          return;
        }
        if (inflate.autoCommit) {
          const node = inflate.node;
          inflate = null;
          commitExpandPop(node);
          return;
        }
        // Ждём longhover commit — радиус уже на linkR
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
    // Раскрытая группа: плавный откат роста → linkR
    if (
      inflate.mode === "expandedGrow" ||
      inflate.mode === "expandedGrowBack"
    ) {
      const from = b.r;
      const rLink =
        b.linkR ??
        bubbleRadiusFromVisits({
          visitCount: nodesList[b.nodeIndex]?.visitCount || 1,
        });
      b.linkR = rLink;
      if (from <= rLink + 0.5) {
        b.r = rLink;
        if (world) {
          unpinBubble(inflate.node);
          endSoftRadiusAdjust(world);
        }
        inflate = null;
        inflateTick += 1;
        return;
      }
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      inflate = {
        id: b.id,
        node: b,
        r0: from,
        r1: rLink,
        t0: now,
        dur: GROUP_EXPANDED_HOVER_SHRINK_MS,
        raf: 0,
        autoCommit: false,
        mode: "expandedGrowBack",
      };
      if (world) beginSoftRadiusAdjust(world);
      ensureInflateLoop();
      return;
    }
    clearHoverChildSpawn();
    const hasKids = world ? isHostExpanded(world, b.host) : false;
    if (hasKids) {
      // Уже есть дети — оставляем группу, сжимаем к linkR без лопания
      const rLink =
        b.linkR ??
        bubbleRadiusFromVisits({
          visitCount: nodesList[b.nodeIndex]?.visitCount || 1,
        });
      b.linkR = rLink;
      b.r = rLink;
      if (world) {
        unpinBubble(inflate.node);
        endSoftRadiusAdjust(world);
        stopCraterFill?.();
        stopCraterFill = startCraterFill({ world, parent: b });
      }
    } else {
      inflate.node.r = inflate.r0;
      if (world) {
        unpinBubble(inflate.node);
        endSoftRadiusAdjust(world);
      }
    }
    inflate = null;
    inflateTick += 1;
  }

  /** Longhover 3с: оставшиеся дети сразу + лопание / shrink. */
  function onExpandCommit(b: BubbleNode) {
    if (!world) return;
    if (poppingId) return;
    // Overflow: commit expand хвоста
    if (b.isOverflowGroup && (b.overflowChildIndexes?.length || 0) > 0) {
      if (inflate && inflate.id === b.id) {
        if (inflate.raf && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(inflate.raf);
        }
        inflate.node.r = inflate.r1;
        const node = inflate.node;
        inflate = null;
        commitExpandPop(node, { skipSpawn: false });
        return;
      }
      onInflateStart(b, true);
      return;
    }
    if (b.kind !== "host") return;
    // Hover-рост на раскрытой → longhover сворачивает группу
    if (
      isHostExpanded(world, b.host) &&
      (!inflate ||
        inflate.id !== b.id ||
        inflate.mode === "expandedGrow" ||
        inflate.mode === "expandedGrowBack")
    ) {
      if (inflate?.id === b.id) {
        if (inflate.raf && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(inflate.raf);
        }
        inflate = null;
        endSoftRadiusAdjust(world);
      }
      toggleExpand(b);
      return;
    }
    if (inflate && inflate.id === b.id) {
      if (inflate.raf && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(inflate.raf);
      }
      inflate.node.r = inflate.r1;
      const node = inflate.node;
      inflate = null;
      flushPendingChildren(node);
      commitExpandPop(node, { skipSpawn: true });
      return;
    }
    // Не было inflate — полный цикл
    onInflateStart(b, true);
  }

  /** Contextmenu: inflate 3с → pop → expand. */
  function onExpandRequest(b: BubbleNode) {
    if (!world || b.kind !== "host") return;
    if (isHostExpanded(world, b.host)) {
      toggleExpand(b);
      return;
    }
    clearHoverChildSpawn();
    onInflateStart(b, true);
  }

  /**
   * Spawn детей (если нужно) → пауза → pop + shrink к linkR.
   * skipSpawn — дети уже по очереди / flush на hover.
   */
  function commitExpandPop(b: BubbleNode, { skipSpawn = false } = {}) {
    if (!world || poppingId || collapsingId) return;
    clearHoverChildSpawn();

    // Overflow-группа: раскрыть хвост из этого шара
    if (b.isOverflowGroup && (b.overflowChildIndexes?.length || 0) > 0) {
      if (!skipSpawn) {
        expandOverflowNode({
          world,
          parent: b,
          nodesList,
          maxChildren: GROUP_MAX_CHILDREN,
        });
        refreshVisible();
      }
      if (expandTimer) clearTimeout(expandTimer);
      expandTimer = setTimeout(() => {
        expandTimer = null;
        if (!world) return;
        const rExpanded = b.r;
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
          refreshVisible();
        }, GROUP_POP_MS);
      }, GROUP_SPAWN_LEAD_MS);
      return;
    }

    const group = bookmarkList.get(b.host);
    if (
      !skipSpawn &&
      group &&
      group.nodes.length > 1 &&
      !isHostExpanded(world, b.host)
    ) {
      expandHost({
        world,
        host: b.host,
        childIndexes: group.nodes.slice(1),
        nodesList,
        maxChildren: GROUP_MAX_CHILDREN,
      });
      registerExpanded(b.host);
      refreshVisible();
    } else if (skipSpawn && group && !isHostExpanded(world, b.host)) {
      // 3с без детей (leave не было, но stagger ещё не стартовал) — все сразу
      expandHost({
        world,
        host: b.host,
        childIndexes: group.nodes.slice(1),
        nodesList,
        maxChildren: GROUP_MAX_CHILDREN,
        keepParentR: true,
      });
      registerExpanded(b.host);
      refreshVisible();
    }
    if (expandTimer) clearTimeout(expandTimer);
    // Через LEAD_MS — лопание и сжатие к весу своей ссылки
    expandTimer = setTimeout(() => {
      expandTimer = null;
      if (!world) return;
      const rExpanded = b.r;
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
    if (world) beginSoftRadiusAdjust(world);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const loop = () => {
      shrinkRaf = 0;
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const u = Math.min(1, (now - t0) / GROUP_POP_MS);
      shrinkHostFrame({ parent: b, r0, r1, u });
      inflateTick += 1;
      // Мягкий nudge — links/collide подтягивают кольцо без разгона поля
      if (world && inflateTick % 4 === 0) nudgeSim(world, 0.08);
      if (u < 1) {
        shrinkRaf = requestAnimationFrame(loop);
      } else if (world) {
        endSoftRadiusAdjust(world);
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
      registerCollapsed(b.host);
      refreshVisible();
      return;
    }
    collapsingId = b.id;
    if (world) beginSoftRadiusAdjust(world);
    // Текущий r — linkR (разложенный покой); рост только до groupR (не cluster)
    const r0 = b.r;
    const groupR = b.groupR ?? b.baseR ?? r0;
    b.groupR = groupR;
    // Потолок роста при fold — размер группы, не площадь детей
    const r1 = groupR;
    // Снапшот стартовых позиций детей для стабильного lerp
    const starts = children.map((c) => ({
      node: c,
      x: c.x ?? 0,
      y: c.y ?? 0,
      r: c.baseR ?? c.r,
    }));
    // Если уже больше группы — сразу прижать к groupR
    if (r0 > groupR) b.r = groupR;    pinBubbleAt(b, b.x ?? 0, b.y ?? 0, world.width, world.height);
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
        registerCollapsed(b.host);
        endSoftRadiusAdjust(world);
        nudgeSim(world, 0.15);
        inflateTick += 1;
        refreshVisible();
      }, GROUP_POP_MS);
    };
    if (typeof requestAnimationFrame === "undefined") {
      collapseHost(world, b.host);
      collapsingId = null;
      registerCollapsed(b.host);
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
      // Collide-соседи; links выкл — unfold не схлопывается
      beginDragCollisions(world);
    }
    if (!dragMoved) return;
    const pt = fieldPointFromClient(e.clientX, e.clientY);
    // Перетаскиваемый — clamp к краям; соседей bounce догонит в onTick
    pinBubbleAt(dragBubble, pt.x, pt.y, world.width, world.height);
    bounceBubblesAtWorldEdges(world.nodes, world.width, world.height);
    // Тик поля — остальные шары тоже двигаются (collide)
    frame += 1;
    dragTick += 1;
    e.preventDefault();
  }

  function onWindowPointerUp(e: PointerEvent) {
    if (!dragBubble) return;
    if (world) {
      unpinBubble(dragBubble);
      // Links обратно; без reheat — иначе unfold снова стянется
      endDragCollisions(world);
      nudgeSim(world, 0.12);
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

  /** Overlay перехода: круг из шарика на весь экран */
  let navBurst: {
    cx: number;
    cy: number;
    hue: number;
    url: string;
  } | null = null;
  const navBurstR = tweened(0, { duration: 520, easing: cubicOut });
  let navBusy = false;

  function prefersReducedMotion(): boolean {
    try {
      return (
        typeof matchMedia !== "undefined" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch {
      return false;
    }
  }

  function goToUrl(url: string) {
    try {
      window.location.href = url;
    } catch {
      /* */
    }
  }

  function onBubbleClick(e: MouseEvent, b: BubbleNode) {
    if (dragMoved) {
      e.preventDefault();
      e.stopPropagation();
      dragMoved = false;
      return;
    }
    // Новая вкладка / модификаторы — нативный переход без анимации
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (navBusy) {
      e.preventDefault();
      return;
    }
    const url = b.url;
    if (
      shouldSkipNavTransition({
        reducedMotion: prefersReducedMotion(),
        url,
      })
    ) {
      return; // обычный <a href>
    }
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget as HTMLElement | null;
    const rect = el?.getBoundingClientRect?.();
    const cx = rect
      ? rect.left + rect.width / 2
      : e.clientX;
    const cy = rect
      ? rect.top + rect.height / 2
      : e.clientY;
    const r0 = rect ? Math.max(rect.width, rect.height) / 2 : b.r || 40;
    const hue = bubbleNavHue({
      kind: b.kind,
      isBookmark: b.isBookmark,
      isSession: b.isSession,
      isOverflowGroup: b.isOverflowGroup,
      groupable: isGroupableBubble(b),
    });

    navBusy = true;
    navBurst = { cx, cy, hue, url };
    navBurstR.set(r0, { duration: 0 }).then(() => {
      const vw = window.innerWidth || 800;
      const vh = window.innerHeight || 600;
      const target = viewportCoverRadius(cx, cy, vw, vh);
      return navBurstR.set(target);
    }).then(() => {
      goToUrl(url);
    }).catch(() => {
      goToUrl(url);
    });
  }

  /** Star: создать / снять закладку в chrome.bookmarks. */
  function onBubbleToggleBookmark(b: BubbleNode) {
    try {
      if (typeof chrome === "undefined" || !chrome.bookmarks) return;
      if (b.isBookmark && b.nodeIndex != null) {
        const node = nodesList[b.nodeIndex];
        const id = node?.id;
        if (id != null) chrome.bookmarks.remove(String(id));
        b.isBookmark = false;
      } else {
        chrome.bookmarks.create({ url: b.url, title: b.title }, (created) => {
          b.isBookmark = true;
          const node = nodesList[b.nodeIndex];
          if (node && created?.id) {
            node.isBookmark = true;
            node.id = created.id;
          }
        });
        b.isBookmark = true;
      }
      inflateTick += 1;
    } catch (err) {
      console.error(err);
    }
  }

  /** Delete: pop → убрать из симуляции + history/bookmarks. */
  function onBubbleDelete(b: BubbleNode) {
    if (!world || poppingId) return;
    poppingId = b.id;
    inflateTick += 1;
    const url = b.url;
    const node = nodesList[b.nodeIndex];
    setTimeout(() => {
      if (!world) return;
      const drop = new Set<string>([b.id]);
      for (const n of world.nodes) {
        if (n.parentId === b.id) drop.add(n.id);
      }
      world.nodes = world.nodes.filter((n) => !drop.has(n.id));
      world.links = world.links.filter((l) => {
        const s = typeof l.source === "object" ? (l.source as BubbleNode).id : l.source;
        const t = typeof l.target === "object" ? (l.target as BubbleNode).id : l.target;
        return !drop.has(String(s)) && !drop.has(String(t));
      });
      world.simulation.nodes(world.nodes);
      world.linkForce.links(world.links);
      poppingId = null;
      inflateTick += 1;
      refreshVisible();
      try {
        if (typeof chrome !== "undefined") {
          if (node?.isBookmark && node.id != null) {
            chrome.bookmarks.remove(String(node.id));
          }
          chrome.history?.deleteUrl?.({ url });
        }
      } catch (err) {
        console.error(err);
      }
    }, GROUP_POP_MS);
  }

  /** Host с >1 URL или overflow-хвост — groupable. */
  function isGroupableBubble(b: BubbleNode): boolean {
    if (b.isOverflowGroup && (b.overflowChildIndexes?.length || 0) > 0) return true;
    return b.kind === "host" && (bookmarkList.get(b.host)?.nodes.length || 0) > 1;
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
    clearHoverChildSpawn();
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
      groupable={isGroupableBubble(b)}
      session={!!b.isSession}
      expanded={!!expandedHosts[b.host] && b.kind === "host"}
      onInflateStart={() => {
        // Раскрытая группа — медленный рост; иначе unfold-сжатие
        if (world && b.kind === "host" && isHostExpanded(world, b.host))
          onExpandedHoverGrow(b);
        else onInflateStart(b, false);
      }}
      onInflateCancel={() => onInflateCancel(b)}
      onExpandCommit={() => onExpandCommit(b)}
      onExpandRequest={() => onExpandRequest(b)}
      onPointerDown={(e) => onBubblePointerDown(b, e)}
      onLinkClick={(e) => onBubbleClick(e, b)}
      onDelete={() => onBubbleDelete(b)}
      onToggleBookmark={() => onBubbleToggleBookmark(b)}
    />
  {/each}
</section>

{#if navBurst}
  <!-- На body-слое: иначе overflow/z-index поля режет круг под filterBar -->
  <div
    class="navBurst"
    aria-hidden="true"
    use:navBurstPortal
    style="
      left: {navBurst.cx}px;
      top: {navBurst.cy}px;
      width: {$navBurstR * 2}px;
      height: {$navBurstR * 2}px;
      margin-left: {-($navBurstR)}px;
      margin-top: {-($navBurstR)}px;
      --hue: {navBurst.hue};
    "
  ></div>
{/if}

<style>
  .bubbleField {
    position: relative;
    width: 100%;
    min-height: 560px;
    overflow: hidden; /* не пускаем шары на часы / filter bar */
    /* Без цветного radial — только нейтральный слой поверх anchores; hero-картинка цветная */
    background: transparent;
  }
  /* Переход: круг из клика → весь экран; стили :global — нода на body-слое */
  :global(.navBurst) {
    position: fixed;
    z-index: 300001;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle at 35% 30%,
      hsl(var(--hue), 72%, 58%),
      hsl(var(--hue), 70%, 32%) 55%,
      #222 100%
    );
    box-shadow: inset 0 -0.2em 0.5em hsla(0, 0%, 0%, 0.25);
    will-change: width, height, margin;
  }
</style>
