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
  let i = 0;
  for (const [host, group] of bookmarkList) {
    if (nodes.length >= BUBBLE_SIM_CAP) break;
    const idx = group.nodes[0];
    const n = nodesList[idx];
    if (!n?.url) continue;
    const visitCount = group.hostVisitCount || n.visitCount || 1;
    const r = bubbleRadiusFromVisits({ visitCount });
    // Старт в верхней зоне поля (рядом с focusY), не по всей высоте мира
    const focusY = focusYForWorld(height);
    const x = (width * 0.12 + ((i * 97) % Math.max(width * 0.76, 1))) | 0;
    const y = (focusY * 0.55 + ((i * 37) % Math.max(focusY * 0.9, 1))) | 0;
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

/** Высота мира от числа пузырей (чтобы скроллить при 1000). */
export function worldHeightForCount(count: number, width: number): number {
  const area = count * Math.PI * 55 * 55;
  const packed = Math.ceil(area / Math.max(width, 320)) + 280;
  // Минимум ≈ один экран dial, без искусственных 900px для 10 сайтов
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

  const focusY = focusYForWorld(height);
  const simulation = forceSimulation<BubbleNode>(nodes)
    .force(
      "collide",
      forceCollide<BubbleNode>()
        .radius((d) => d.r + 4)
        .strength(0.85)
        .iterations(2)
    )
    .force("charge", forceManyBody<BubbleNode>().strength(-22).distanceMax(240))
    .force("x", forceX(width / 2).strength(0.045))
    // Тянем к верху dial-поля, не к height/2
    .force("y", forceY(focusY).strength(0.06))
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
  const focusY = focusYForWorld(height);
  world.simulation.force("x", forceX(width / 2).strength(0.045));
  world.simulation.force("y", forceY(focusY).strength(0.06));
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

/** AABB cull: scrollY/viewH в координатах поля (0 = верх .bubbleField). */
export function visibleBubbles({
  nodes,
  scrollY,
  viewH,
  pad = VIEWPORT_PAD,
}: {
  nodes: BubbleNode[];
  /** Скролл относительно верха bubbleField (window.scrollY - fieldTop) */
  scrollY: number;
  viewH: number;
  pad?: number;
}): BubbleNode[] {
  const top = scrollY - pad;
  const bottom = scrollY + viewH + pad;
  return nodes.filter((n) => {
    const y = n.y ?? 0;
    const r = n.r || 40;
    return y + r >= top && y - r <= bottom;
  });
}

export function stopWorld(world: BubbleWorld | null): void {
  world?.simulation.stop();
}
