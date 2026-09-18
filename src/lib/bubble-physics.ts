/**
 * d3-force симуляция пузырьков (collide + лёгкий charge).
 * Без three.js — new-tab должен оставаться лёгким.
 */
import {
  forceSimulation,
  forceCollide,
  forceManyBody,
  forceX,
  forceY,
  forceLink,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
  type ForceLink,
} from "d3-force";
import { bubbleRadiusFromVisits } from "./bubble-radius";
import type { BookmarkNode, HostGroup } from "./bookmarks";

export type BubbleKind = "host" | "child";

export type BubbleNode = SimulationNodeDatum & {
  id: string;
  kind: BubbleKind;
  host: string;
  /** Индекс в nodesList (для child / primary) */
  nodeIndex: number;
  r: number;
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

/** Позиция в сетке по индексу — равномерно по ширине и высоте мира. */
export function gridSpawnXY({
  index,
  count,
  width,
  height,
  r,
}: {
  index: number;
  count: number;
  width: number;
  height: number;
  r: number;
}): { x: number; y: number } {
  const pad = r + 16;
  const cols = Math.max(1, Math.floor((width - pad * 2) / (r * 2 + 12)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = Math.max((width - pad * 2) / cols, r * 2 + 8);
  const cellH = Math.max((height - pad * 2) / rows, r * 2 + 8);
  const col = index % cols;
  const row = (index / cols) | 0;
  const jitterX = ((index * 53) % 17) - 8;
  const jitterY = ((index * 71) % 17) - 8;
  return {
    x: pad + col * cellW + cellW * 0.5 + jitterX,
    y: pad + row * cellH + cellH * 0.5 + jitterY,
  };
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
  const nodes: BubbleNode[] = [];
  const cap = Math.min(bookmarkList.size, BUBBLE_SIM_CAP);
  let i = 0;
  for (const [host, group] of bookmarkList) {
    if (nodes.length >= BUBBLE_SIM_CAP) break;
    const idx = group.nodes[0];
    const n = nodesList[idx];
    if (!n?.url) continue;
    const visitCount = group.hostVisitCount || n.visitCount || 1;
    const r = bubbleRadiusFromVisits({ visitCount });
    const { x, y } = gridSpawnXY({ index: i, count: cap, width, height, r });
    nodes.push({
      id: hostId(host),
      kind: "host",
      host,
      nodeIndex: idx,
      r,
      visitCount,
      title: n.title || host,
      url: n.url,
      isBookmark: n.isBookmark,
      lastVisitTime: group.hostLastVisitTime ?? n.lastVisitTime,
      spawnIndex: i,
      x,
      y,
      vx: 0,
      vy: 0,
    });
    i++;
  }
  return nodes;
}

/** Якорь по Y: верх dial-секции (не середина высокого мира — иначе шарики «внизу экрана»). */
export function focusYForWorld(height: number): number {
  return Math.min(240, Math.max(160, height * 0.22));
}

/** Высота мира от числа узлов в симуляции (cap), не от полного bookmarkList. */
export function worldHeightForCount(count: number, width: number): number {
  const simCount = Math.min(Math.max(count, 1), BUBBLE_SIM_CAP);
  const avgR = 55;
  const area = simCount * Math.PI * avgR * avgR * 1.15;
  const packed = Math.ceil(area / Math.max(width, 320)) + 240;
  return Math.max(packed, 560);
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
      return (s.r || 40) + (t.r || 28) + 12;
    })
    .strength(0.55);

  const anchorY = height * 0.5;
  const simulation = forceSimulation<BubbleNode>(nodes)
    .force(
      "collide",
      forceCollide<BubbleNode>()
        .radius((d) => d.r + 4)
        .strength(0.85)
        .iterations(2)
    )
    .force("charge", forceManyBody<BubbleNode>().strength(-22).distanceMax(240))
    .force("x", forceX(width / 2).strength(0.035))
    // Слабый якорь по центру высоты — не кластеризуем всё у focusY
    .force("y", forceY(anchorY).strength(0.018))
    .force("link", linkForce)
    .alphaDecay(0.028)
    .velocityDecay(0.35);

  return { width, height, nodes, links, simulation, linkForce };
}

/** Перезапуск «пружины» после изменения состава. */
export function reheat(world: BubbleWorld, alpha = 0.6): void {
  world.simulation.alpha(alpha).restart();
}

export function resizeWorld(world: BubbleWorld, width: number, height: number): void {
  world.width = width;
  world.height = height;
  const anchorY = height * 0.5;
  world.simulation.force("x", forceX(width / 2).strength(0.035));
  world.simulation.force("y", forceY(anchorY).strength(0.018));
  reheat(world, 0.35);
}

/**
 * Раскрыть host: добавить child-пузыри вокруг + link к родителю.
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

  const px = parent.x ?? world.width / 2;
  const py = parent.y ?? world.height / 2;
  const slice = childIndexes.slice(0, maxChildren);

  slice.forEach((nodeIndex, i) => {
    const n = nodesList[nodeIndex];
    if (!n?.url) return;
    const visitCount = n.visitCount || 1;
    const r = bubbleRadiusFromVisits({ visitCount });
    const angle = (Math.PI * 2 * i) / Math.max(slice.length, 1);
    const dist = parent.r + r + 28;
    const child: BubbleNode = {
      id: childId(host, nodeIndex),
      kind: "child",
      host,
      nodeIndex,
      r,
      visitCount,
      title: n.title || host,
      url: n.url,
      isBookmark: n.isBookmark,
      lastVisitTime: n.lastVisitTime as number | undefined,
      parentId: parent.id,
      spawnIndex: world.nodes.length + i,
      x: px + Math.cos(angle) * dist * 0.35,
      y: py + Math.sin(angle) * dist * 0.35,
      vx: 0,
      vy: 0,
    };
    world.nodes.push(child);
    world.links.push({
      id: `link:${parent.id}:${child.id}`,
      source: parent.id,
      target: child.id,
    });
  });

  world.simulation.nodes(world.nodes);
  world.linkForce.links(world.links);
  reheat(world, 0.85);
}

/** Свернуть children хоста. */
export function collapseHost(world: BubbleWorld, host: string): void {
  const pid = hostId(host);
  world.nodes = world.nodes.filter((n) => n.parentId !== pid);
  world.links = world.links.filter((l) => {
    const s = typeof l.source === "object" ? (l.source as BubbleNode).id : l.source;
    const t = typeof l.target === "object" ? (l.target as BubbleNode).id : l.target;
    return s !== pid && t !== pid;
  });
  world.simulation.nodes(world.nodes);
  world.linkForce.links(world.links);
  reheat(world, 0.5);
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
