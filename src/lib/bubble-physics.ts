/**
 * d3-force симуляция пузырьков (collide + лёгкий charge).
 * Без three.js — new-tab должен оставаться лёгким.
 */
import {
  forceSimulation,
  forceCollide,
  forceX,
  forceY,
  forceLink,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
  type ForceLink,
} from "d3-force";
import { BUBBLE_R_MAX, bubbleRadiusFromVisits } from "./bubble-radius";
import type { BookmarkNode, HostGroup } from "./bookmarks";

export type BubbleKind = "host" | "child";

export type BubbleNode = SimulationNodeDatum & {
  id: string;
  kind: BubbleKind;
  host: string;
  /** Индекс в nodesList (для child / primary) */
  nodeIndex: number;
  r: number;
  /** Радиус до inflate/expand — вернуть при collapse */
  baseR?: number;
  /** Сложенный вес группы (hostVisitCount) — fold / idle */
  groupR?: number;
  /** Вес своей ссылки (primary visitCount) — после unfold */
  linkR?: number;
  visitCount: number;
  title: string;
  url: string;
  isBookmark?: boolean;
  parentId?: string;
  /** Последний визит (ms), для tooltip */
  lastVisitTime?: number;
  /** Порядковый индекс для spawn-delay */
  spawnIndex: number;
};

/** Зазор между ячейками сетки (collide padding ≈ gap/2). */
export const PACK_GAP = 12;

export type BubbleLink = SimulationLinkDatum<BubbleNode> & {
  id: string;
};

export type BubbleWorld = {
  width: number;
  height: number;
  nodes: BubbleNode[];
  links: BubbleLink[];
  simulation: Simulation<BubbleNode, BubbleLink>;
  linkForce: ForceLink<BubbleNode, BubbleLink>;
};

const VIEWPORT_PAD = 120;
/** Жёсткий потолок тел в симуляции — защита new-tab */
export const BUBBLE_SIM_CAP = 400;

function hostId(host: string): string {
  return `host:${host}`;
}

function childId(host: string, nodeIndex: number): string {
  return `child:${host}:${nodeIndex}`;
}

/**
 * Позиция в сетке сверху вниз — единый cell на всех (не per-node r),
 * иначе крупные/мелкие шары попадают в разные cols и наезжают.
 */
export function gridSpawnXY({
  index,
  count,
  width,
  height,
  r,
  cell: cellOpt,
}: {
  index: number;
  count: number;
  width: number;
  height: number;
  r: number;
  /** Общий размер ячейки сетки; по умолчанию 2r+gap */
  cell?: number;
}): { x: number; y: number } {
  const cell = cellOpt ?? 2 * r + PACK_GAP;
  const pad = PACK_GAP + 8;
  const cols = Math.max(1, Math.floor((Math.max(width, 320) - pad * 2) / cell));
  const col = index % cols;
  const row = (index / cols) | 0;
  // Небольшой jitter, чтобы не стояли идеальной решёткой
  const jitterX = ((index * 53) % 11) - 5;
  const jitterY = ((index * 71) % 11) - 5;
  const x = pad + col * cell + cell * 0.5 + jitterX;
  const y = pad + row * cell + cell * 0.5 + jitterY;
  // Не вылезать за низ мира (высота уже посчитана под сетку)
  const maxY = Math.max(pad + r, height - pad - r);
  return { x, y: Math.min(y, maxY) };
}

/** Собрать host-пузыри из индекса закладок (без children). */
export function buildHostBubbles({
  bookmarkList,
  nodesList,
  width,
  height,
}: {
  bookmarkList: Map<string, HostGroup>;
  nodesList: BookmarkNode[];
  width: number;
  height: number;
}): BubbleNode[] {
  // Черновик: радиусы и метаданные, spawn — второй проход с единым cell
  type Draft = {
    host: string;
    idx: number;
    n: BookmarkNode;
    group: HostGroup;
    groupR: number;
    linkR: number;
    groupVisits: number;
  };
  const drafts: Draft[] = [];
  for (const [host, group] of bookmarkList) {
    if (drafts.length >= BUBBLE_SIM_CAP) break;
    const idx = group.nodes[0];
    const n = nodesList[idx];
    if (!n?.url) continue;
    const linkVisits = n.visitCount || 1;
    const groupVisits = group.hostVisitCount || linkVisits;
    drafts.push({
      host,
      idx,
      n,
      group,
      groupR: bubbleRadiusFromVisits({ visitCount: groupVisits }),
      linkR: bubbleRadiusFromVisits({ visitCount: linkVisits }),
      groupVisits,
    });
  }
  const cap = drafts.length;
  // Единая ячейка по max r — без наложений на старте
  const maxR = drafts.reduce((m, d) => Math.max(m, d.groupR), 40);
  const cell = 2 * maxR + PACK_GAP;
  const nodes: BubbleNode[] = [];
  drafts.forEach((d, i) => {
    const { x, y } = gridSpawnXY({
      index: i,
      count: cap,
      width,
      height,
      r: d.groupR,
      cell,
    });
    nodes.push({
      id: hostId(d.host),
      kind: "host",
      host: d.host,
      nodeIndex: d.idx,
      r: d.groupR,
      baseR: d.groupR,
      groupR: d.groupR,
      linkR: d.linkR,
      visitCount: d.groupVisits,
      title: d.n.title || d.host,
      url: d.n.url,
      isBookmark: d.n.isBookmark,
      lastVisitTime: d.group.hostLastVisitTime ?? d.n.lastVisitTime,
      spawnIndex: i,
      x,
      y,
      vx: 0,
      vy: 0,
    });
  });
  return nodes;
}

/**
 * Якорь по Y: верх блока с шариками (`.bubbleField`), не верх страницы/viewport.
 * В координатах поля — центр первого ряда сетки (как gridSpawnXY).
 */
export function focusYForWorld(height: number, avgR = 52): number {
  const pad = PACK_GAP + 8;
  const cell = 2 * avgR + PACK_GAP;
  // Верх dial-блока = середина первого ряда шариков
  const topOfBlock = pad + cell * 0.5;
  // На очень низком поле не тянуть ниже середины высоты
  return Math.min(topOfBlock, Math.max(pad + 20, height * 0.45));
}

/**
 * Высота мира сеточной упаковкой (не площадью кругов — иначе в 2× короче нужному).
 * minHeight — остаток viewport под filter bar (preview не «полоска»).
 */
export function worldHeightForCount(
  count: number,
  width: number,
  {
    avgR = 52,
    minHeight = 560,
  }: { avgR?: number; minHeight?: number } = {}
): number {
  const simCount = Math.min(Math.max(count, 1), BUBBLE_SIM_CAP);
  const cell = 2 * avgR + PACK_GAP;
  const pad = PACK_GAP + 8;
  // Те же cols, что gridSpawnXY (с pad) — иначе высота короче рядов
  const cols = Math.max(
    1,
    Math.floor((Math.max(width, 320) - pad * 2) / cell)
  );
  const rows = Math.ceil(simCount / cols);
  // pad сверху/снизу — без лишней «пустоты после последнего ряда»
  const packed = rows * cell + pad * 2;
  return Math.max(packed, minHeight);
}

export function createBubbleWorld({
  nodes,
  width,
  height,
}: {
  nodes: BubbleNode[];
  width: number;
  height: number;
}): BubbleWorld {
  const links: BubbleLink[] = [];
  const linkForce = forceLink<BubbleNode, BubbleLink>(links)
    .id((d) => d.id)
    .distance((l) => {
      const s = l.source as BubbleNode;
      const t = l.target as BubbleNode;
      // Короче зазор — дети не «кольцом» вокруг кратера
      return (s.r || 40) + (t.r || 28) + 6;
    })
    .strength(0.7);

  // Якорь Y — верх блока с шариками (не страница/часы)
  const topY = focusYForWorld(height);
  const simulation = forceSimulation<BubbleNode>(nodes)
    .force(
      "collide",
      forceCollide<BubbleNode>()
        .radius((d) => (d.r || 40) + 1)
        .strength(1)
        .iterations(6)
    )
    // Без many-body: в drag-collisions его нет — иначе давит на overlap
    // Стягивание к середине по горизонтали (сила 0.003 — едва заметная)
    .force("x", forceX(width / 2).strength(0.003))
    // Стягивание к верху блока с шариками (сила 0.006)
    .force("y", forceY(topY).strength(0.006))
    // Связи родитель↔дети: держат раскрытую группу рядом
    .force("link", linkForce)
    // Как быстро «остывает» движение после толчка (выше — раньше останавливается)
    .alphaDecay(0.022)
    // Трение: гасит скорость шаров (выше — меньше скольжения)
    .velocityDecay(0.28);

  return { width, height, nodes, links, simulation, linkForce };
}

/** Перезапуск «пружины» после изменения состава. */
export function reheat(world: BubbleWorld, alpha = 0.6): void {
  world.simulation.alphaTarget(0).alpha(alpha).restart();
}

/**
 * Drag как в d3 drag-collisions: держим цель активности, чтобы разграничение
 * двигало соседей вокруг закреплённого (fx/fy) узла.
 */
export function beginDragCollisions(world: BubbleWorld): void {
  world.simulation.alphaTarget(0.3).restart();
}

/** Конец drag: сбросить цель активности, разграничение дорешает остаток. */
export function endDragCollisions(world: BubbleWorld): void {
  world.simulation.alphaTarget(0);
}

export function resizeWorld(world: BubbleWorld, width: number, height: number): void {
  world.width = width;
  world.height = height;
  const topY = focusYForWorld(height);
  world.simulation.force("x", forceX(width / 2).strength(0.003));
  world.simulation.force("y", forceY(topY).strength(0.006));
  // Обновить collide на случай смены состава радиусов
  world.simulation.force(
    "collide",
    forceCollide<BubbleNode>()
      .radius((d) => (d.r || 40) + 1)
      .strength(1)
      .iterations(6)
  );
  reheat(world, 0.35);
}

/**
 * Радиус кластера по площади детей: sqrt(sum(π r²)/π) + pad.
 * Не меньше r0 (текущий вес родителя).
 */
export function clusterRadiusFromChildRadii({
  childRadii,
  r0,
  pad = 10,
}: {
  childRadii: number[];
  r0: number;
  pad?: number;
}): number {
  if (!childRadii.length) return r0;
  const area = childRadii.reduce((s, r) => s + Math.PI * r * r, 0);
  const fromArea = Math.sqrt(area / Math.PI) + pad;
  // Потолок — не раздувать бесконечно при десятках детей
  const capped = Math.min(fromArea, Math.max(r0 * 2.8, BUBBLE_R_MAX * 1.9));
  return Math.round(capped);
}

/** Оценка cluster-r по числу детей (avg child), для inflate до spawn. */
export function expandedHostRadius(r0: number, childCount: number): number {
  const n = Math.max(childCount, 1);
  const avgChild = 34;
  return clusterRadiusFromChildRadii({
    childRadii: Array.from({ length: n }, () => avgChild),
    r0,
  });
}

/**
 * Раскрыть host: родитель на cluster-r, дети спавнятся под ним (collide раздвигает).
 * Лимит children за раз — чтобы не взорвать new-tab.
 */
export function expandHost({
  world,
  host,
  childIndexes,
  nodesList,
  maxChildren = 24,
}: {
  world: BubbleWorld;
  host: string;
  childIndexes: number[];
  nodesList: BookmarkNode[];
  maxChildren?: number;
}): void {
  const parent = world.nodes.find((n) => n.id === hostId(host));
  if (!parent) return;

  // Уже раскрыт — no-op
  if (world.nodes.some((n) => n.parentId === parent.id)) return;

  const slice = childIndexes.slice(0, maxChildren);
  const childRadii: number[] = [];
  for (const nodeIndex of slice) {
    const n = nodesList[nodeIndex];
    if (!n?.url) continue;
    childRadii.push(bubbleRadiusFromVisits({ visitCount: n.visitCount || 1 }));
  }

  // groupR = сложенный; linkR = вес своей ссылки
  parent.groupR = parent.groupR ?? parent.baseR ?? parent.r;
  if (parent.linkR == null) {
    const primary = nodesList[parent.nodeIndex];
    parent.linkR = bubbleRadiusFromVisits({
      visitCount: primary?.visitCount || 1,
    });
  }
  parent.baseR = parent.groupR;
  // Inflate до площади детей — соседи отпружинят через collide
  parent.r = clusterRadiusFromChildRadii({
    childRadii,
    r0: parent.groupR,
  });

  const px = parent.x ?? world.width / 2;
  const py = parent.y ?? world.height / 2;

  let ci = 0;
  slice.forEach((nodeIndex) => {
    const n = nodesList[nodeIndex];
    if (!n?.url) return;
    const visitCount = n.visitCount || 1;
    const r = bubbleRadiusFromVisits({ visitCount });
    // Под родителем + лёгкий jitter — физика разнесёт
    const jx = ((ci * 17) % 9) - 4;
    const jy = ((ci * 23) % 9) - 4;
    const child: BubbleNode = {
      id: childId(host, nodeIndex),
      kind: "child",
      host,
      nodeIndex,
      r,
      baseR: r,
      visitCount,
      title: n.title || host,
      url: n.url,
      isBookmark: n.isBookmark,
      lastVisitTime: n.lastVisitTime as number | undefined,
      parentId: parent.id,
      // spawnIndex 0 → без stagger: вместе с unfold
      spawnIndex: 0,
      x: px + jx,
      y: py + jy,
      vx: jx * 0.4,
      vy: jy * 0.4,
    };
    world.nodes.push(child);
    world.links.push({
      id: `link:${parent.id}:${child.id}`,
      source: parent.id,
      target: child.id,
    });
    ci += 1;
  });

  world.simulation.nodes(world.nodes);
  world.linkForce.links(world.links);
  // Сильный reheat — родитель большой, место раздвигается
  reheat(world, 1);
}

/** Дети хоста (для absorb / orbit). */
export function listHostChildren(world: BubbleWorld, host: string): BubbleNode[] {
  const pid = hostId(host);
  return world.nodes.filter((n) => n.parentId === pid);
}

/** Свернуть children хоста и вернуть родителю groupR (сложенный вес). */
export function collapseHost(world: BubbleWorld, host: string): void {
  const pid = hostId(host);
  const parent = world.nodes.find((n) => n.id === pid);
  world.nodes = world.nodes.filter((n) => n.parentId !== pid);
  world.links = world.links.filter((l) => {
    const s = typeof l.source === "object" ? (l.source as BubbleNode).id : l.source;
    const t = typeof l.target === "object" ? (l.target as BubbleNode).id : l.target;
    return s !== pid && t !== pid;
  });
  if (parent) {
    const g = parent.groupR ?? parent.baseR ?? parent.r;
    parent.r = g;
    parent.baseR = g;
  }
  world.simulation.nodes(world.nodes);
  world.linkForce.links(world.links);
  reheat(world, 0.55);
}

/**
 * Один кадр fold: родитель растёт (r0→r1), дети летят к центру и сжимаются.
 * starts — снимок позиций на старте (иначе lerp «съедет»).
 * После u=1 вызвать collapseHost.
 */
export function absorbChildrenFrame({
  parent,
  starts,
  r0,
  r1,
  u,
}: {
  parent: BubbleNode;
  starts: { node: BubbleNode; x: number; y: number; r: number }[];
  r0: number;
  r1: number;
  u: number;
}): void {
  const t = easeOutCubic(u);
  parent.r = r0 + (r1 - r0) * t;
  const px = parent.x ?? 0;
  const py = parent.y ?? 0;
  for (const s of starts) {
    s.node.x = s.x + (px - s.x) * t;
    s.node.y = s.y + (py - s.y) * t;
    s.node.r = Math.max(2, s.r * (1 - t));
    s.node.vx = 0;
    s.node.vy = 0;
  }
}

/**
 * Кадр shrink после pop: родитель с expanded → baseR (вес).
 */
export function shrinkHostFrame({
  parent,
  r0,
  r1,
  u,
}: {
  parent: BubbleNode;
  r0: number;
  r1: number;
  u: number;
}): void {
  parent.r = inflateRadius(r0, r1, u);
}

/**
 * После shrink к linkR: временная сила стягивает детей и ближних хостов
 * в кратер (collide только отталкивает — без этого дыра не схлопывается).
 * Возвращает stop() — снять силу раньше срока.
 */
export function startCraterFill({
  world,
  parent,
  durationMs = GROUP_CRATER_FILL_MS,
  strength = 0.12,
}: {
  world: BubbleWorld;
  parent: BubbleNode;
  durationMs?: number;
  strength?: number;
}): () => void {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  // Радиус «зоны кратера» — от размера inflate (~group/cluster)
  const craterR = Math.max(
    (parent.groupR ?? parent.baseR ?? parent.r) * 3.5,
    220
  );

  const force = (alpha: number) => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const u = Math.min(1, (now - t0) / durationMs);
    // fade out — сначала сильнее, к концу тихо
    const fade = (1 - u) * (1 - u);
    const s = strength * fade * alpha;
    if (s < 0.0005) return;
    const px = parent.x ?? 0;
    const py = parent.y ?? 0;
    for (const n of world.nodes) {
      if (n.id === parent.id) continue;
      if (n.fx != null || n.fy != null) continue;
      const dx = px - (n.x ?? 0);
      const dy = py - (n.y ?? 0);
      const dist = Math.hypot(dx, dy) || 1;
      const isChild = n.parentId === parent.id;
      // Чужие хосты — только из зоны кратера; дети — всегда
      if (!isChild && dist > craterR) continue;
      // Дети тянем сильнее (закрыть кольцо)
      const k = ((isChild ? 2.4 : 1) * s) / dist;
      n.vx = (n.vx ?? 0) + dx * k;
      n.vy = (n.vy ?? 0) + dy * k;
    }
  };

  world.simulation.force("craterFill", force as any);
  // На время fill — плотнее links
  world.linkForce.strength(0.95);
  reheat(world, 1);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    world.simulation.force("craterFill", null);
    world.linkForce.strength(0.7);
    reheat(world, 0.35);
  };

  if (typeof setTimeout !== "undefined") {
    setTimeout(stop, durationMs + 40);
  }
  return stop;
}

/** Один шаг: сдвинуть узел к target (для unit-теста crater fill). */
export function craterPullStep({
  node,
  targetX,
  targetY,
  strength,
}: {
  node: BubbleNode;
  targetX: number;
  targetY: number;
  strength: number;
}): void {
  const dx = targetX - (node.x ?? 0);
  const dy = targetY - (node.y ?? 0);
  const dist = Math.hypot(dx, dy) || 1;
  const k = strength / dist;
  node.x = (node.x ?? 0) + dx * k;
  node.y = (node.y ?? 0) + dy * k;
}

export function isHostExpanded(world: BubbleWorld, host: string): boolean {
  const pid = hostId(host);
  return world.nodes.some((n) => n.parentId === pid);
}

/** Viewport client → координаты внутри .bubbleField (без double-count scroll). */
export function clientToFieldPoint({
  clientX,
  clientY,
  fieldLeft,
  fieldTop,
}: {
  clientX: number;
  clientY: number;
  fieldLeft: number;
  fieldTop: number;
}): { x: number; y: number } {
  // getBoundingClientRect.top уже учитывает document scroll
  return { x: clientX - fieldLeft, y: clientY - fieldTop };
}

/** Сколько px верха поля ушло выше viewport (для cull). */
export function fieldScrollFromRectTop(rectTop: number): number {
  return Math.max(0, -rectTop);
}

/** Направление скролла поля: 1 вниз, -1 вверх, 0 без сдвига. */
export function scrollDirection(
  prevY: number,
  nextY: number,
  threshold = 2
): -1 | 0 | 1 {
  const d = nextY - prevY;
  if (d > threshold) return 1;
  if (d < -threshold) return -1;
  return 0;
}

/** Анимация появления пузыря при входе в viewport. */
export type BubbleEnterAnim = "initial" | "rise" | "fall";

/** Полёт из-за экрана → конечная точка. */
export type BubbleEnterFlight = {
  id: string;
  anim: "rise" | "fall";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
};

export const ENTER_RISE_MS = 720;
export const ENTER_FALL_MS = 580;
/** Рост радиуса перед лопанием / expand группы (совпадает с longhover). */
export const GROUP_INFLATE_MS = 3000;
/** Длительность BubblePop (как при delete в AnchoreItem). */
export const GROUP_POP_MS = 680;
/** Дети видны столько мс до старта лопания родителя. */
export const GROUP_SPAWN_LEAD_MS = 140;
/** Fold: родитель растёт и втягивает детей. */
export const GROUP_ABSORB_MS = 520;
/** После shrink: стягивание кратера вокруг родителя. */
export const GROUP_CRATER_FILL_MS = 920;
/** Во сколько раз растёт r за inflate. */
export const GROUP_INFLATE_SCALE = 2.25;

/** Радиус на прогрессе inflate 0..1. */
export function inflateRadius(r0: number, r1: number, u: number): number {
  const t = easeOutCubic(u);
  return r0 + (r1 - r0) * t;
}

/**
 * Для id, которых не было в prev: rise при скролле вниз, fall вверх.
 * Уже видимые сохраняют прошлую метку (анимация не рестартит).
 */
export function assignEnterAnims({
  prevIds,
  nextIds,
  scrollDir,
  prevAnims = {},
}: {
  prevIds: Set<string> | Iterable<string>;
  nextIds: Iterable<string>;
  scrollDir: -1 | 0 | 1;
  prevAnims?: Record<string, BubbleEnterAnim>;
}): Record<string, BubbleEnterAnim> {
  const prev = prevIds instanceof Set ? prevIds : new Set(prevIds);
  const out: Record<string, BubbleEnterAnim> = {};
  for (const id of nextIds) {
    if (prev.has(id) && prevAnims[id]) {
      out[id] = prevAnims[id];
      continue;
    }
    if (scrollDir > 0) out[id] = "rise";
    else if (scrollDir < 0) out[id] = "fall";
    else out[id] = prevAnims[id] || "initial";
  }
  return out;
}

/** Y старта за нижней (rise) / верхней (fall) кромкой viewport в coords поля. */
export function offscreenEnterY({
  anim,
  scrollY,
  viewH,
  r,
  margin = 28,
}: {
  anim: "rise" | "fall";
  scrollY: number;
  viewH: number;
  r: number;
  margin?: number;
}): number {
  if (anim === "rise") return scrollY + viewH + r + margin;
  return scrollY - r - margin;
}

export function easeOutCubic(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - u, 3);
}

/** Ease-in — ощущение гравитации при падении. */
export function easeInCubic(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * u;
}

export type SeparableBubble = {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Уже на экране — не двигаем, только отталкиваем новичков */
  locked?: boolean;
};

/**
 * Итеративное разведение кругов (collide), чтобы конечные точки не наезжали.
 * locked узлы — якоря; двигаются только !locked.
 */
export function separateBubbles(
  nodes: SeparableBubble[],
  {
    width,
    height,
    iterations = 18,
    gap = 3,
  }: {
    width: number;
    height: number;
    iterations?: number;
    gap?: number;
  }
): SeparableBubble[] {
  const pad = 4;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.locked && b.locked) continue;
        let dx = (b.x - a.x) as number;
        let dy = (b.y - a.y) as number;
        let dist = Math.hypot(dx, dy);
        const min = a.r + b.r + gap;
        if (dist >= min) continue;
        if (dist < 1e-6) {
          dx = 0.01;
          dy = 0;
          dist = 0.01;
        }
        const push = (min - dist) / (a.locked || b.locked ? 1 : 2);
        const ux = dx / dist;
        const uy = dy / dist;
        if (!a.locked) {
          a.x -= ux * push;
          a.y -= uy * push;
        }
        if (!b.locked) {
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
    for (const n of nodes) {
      if (n.locked) continue;
      n.x = Math.max(n.r + pad, Math.min(width - n.r - pad, n.x));
      n.y = Math.max(n.r + pad, Math.min(height - n.r - pad, n.y));
    }
  }
  return nodes;
}

/** Позиция на траектории полёта (0..1). */
export function flightPosition(
  flight: Pick<BubbleEnterFlight, "x0" | "y0" | "x1" | "y1" | "anim">,
  u: number
): { x: number; y: number } {
  const e = flight.anim === "fall" ? easeInCubic(u) : easeOutCubic(u);
  return {
    x: flight.x0 + (flight.x1 - flight.x0) * e,
    y: flight.y0 + (flight.y1 - flight.y0) * e,
  };
}

/** AABB cull: scrollY/viewH в координатах поля (0 = верх .bubbleField). */
export function visibleBubbles({
  nodes,
  scrollY,
  viewH,
  pad = VIEWPORT_PAD,
  /** id пузыря в drag — не cull'ить, иначе потеряем pointer capture */
  pinnedId = null,
}: {
  nodes: BubbleNode[];
  /** Скролл относительно верха bubbleField (window.scrollY - fieldTop) */
  scrollY: number;
  viewH: number;
  pad?: number;
  pinnedId?: string | null;
}): BubbleNode[] {
  const top = scrollY - pad;
  const bottom = scrollY + viewH + pad;
  return nodes.filter((n) => {
    // Пин во время drag всегда в DOM
    if (pinnedId && n.id === pinnedId) return true;
    // fx/fy — зафиксирован симуляцией (drag), тоже держим
    if (n.fx != null || n.fy != null) return true;
    const y = n.y ?? 0;
    const r = n.r || 40;
    return y + r >= top && y - r <= bottom;
  });
}

/**
 * Зафиксировать пузырь под курсором (d3 fx/fy + мгновенные x/y).
 * Координаты клампятся в мир, чтобы не утащить за края.
 */
export function pinBubbleAt(
  node: BubbleNode,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const r = node.r || 40;
  const pad = 4;
  const cx = Math.max(r + pad, Math.min(width - r - pad, x));
  const cy = Math.max(r + pad, Math.min(height - r - pad, y));
  node.fx = cx;
  node.fy = cy;
  node.x = cx;
  node.y = cy;
  node.vx = 0;
  node.vy = 0;
}

/** Снять pin после pointerup — физика снова ведёт узел. */
export function unpinBubble(node: BubbleNode): void {
  node.fx = null;
  node.fy = null;
}

/** Отражение скорости у границ мира (мягкий bounce вместо жёсткого clamp). */
export function bounceBubblesAtWorldEdges(
  nodes: BubbleNode[],
  width: number,
  height: number,
  damp = 0.82
): void {
  const pad = 4;
  for (const n of nodes) {
    if (n.fx != null || n.fy != null) continue;
    const r = n.r || 40;
    const minX = r + pad;
    const maxX = width - r - pad;
    const minY = r + pad;
    const maxY = height - r - pad;
    let x = n.x ?? 0;
    let y = n.y ?? 0;
    let vx = n.vx ?? 0;
    let vy = n.vy ?? 0;
    if (x < minX) {
      x = minX;
      vx = Math.abs(vx) * damp;
    } else if (x > maxX) {
      x = maxX;
      vx = -Math.abs(vx) * damp;
    }
    if (y < minY) {
      y = minY;
      vy = Math.abs(vy) * damp;
    } else if (y > maxY) {
      y = maxY;
      vy = -Math.abs(vy) * damp;
    }
    n.x = x;
    n.y = y;
    n.vx = vx;
    n.vy = vy;
  }
}

/** Жёсткий clamp — для тестов и аварийного удержания внутри поля. */
export function clampBubblesToWorld(
  nodes: BubbleNode[],
  width: number,
  height: number
): void {
  const pad = 4;
  for (const n of nodes) {
    const r = n.r || 40;
    const x = n.x ?? 0;
    const y = n.y ?? 0;
    n.x = Math.max(r + pad, Math.min(width - r - pad, x));
    n.y = Math.max(r + pad, Math.min(height - r - pad, y));
  }
}

export function stopWorld(world: BubbleWorld | null): void {
  world?.simulation.stop();
}
