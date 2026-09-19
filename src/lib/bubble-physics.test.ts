import { describe, expect, it } from "bun:test";
import {
  BUBBLE_SIM_CAP,
  buildHostBubbles,
  bounceBubblesAtWorldEdges,
  clampBubblesToWorld,
  gridSpawnXY,
  visibleBubbles,
  worldHeightForCount,
} from "./bubble-physics";
import type { HostGroup, BookmarkNode } from "./bookmarks";

describe("bubble-physics", () => {
  it("buildHostBubbles creates capped host nodes with radius", () => {
    const nodesList: BookmarkNode[] = [
      { url: "https://a.com/", title: "A", visitCount: 10 },
      { url: "https://b.com/", title: "B", visitCount: 100 },
    ];
    const map = new Map<string, HostGroup>([
      ["a.com", { nodes: [0], hostVisitCount: 10, host: "a.com" }],
      ["b.com", { nodes: [1], hostVisitCount: 100, host: "b.com" }],
    ]);
    const bubbles = buildHostBubbles({
      bookmarkList: map,
      nodesList,
      width: 800,
      height: 600,
    });
    expect(bubbles.length).toBe(2);
    expect(bubbles[1].r).toBeGreaterThan(bubbles[0].r);
    expect(bubbles.length).toBeLessThanOrEqual(BUBBLE_SIM_CAP);
  });

  it("buildHostBubbles uses uniform grid cell so hosts do not spawn overlapped", () => {
    const nodesList: BookmarkNode[] = [];
    const map = new Map<string, HostGroup>();
    for (let i = 0; i < 20; i++) {
      nodesList.push({
        url: `https://h${i}.test/`,
        title: `H${i}`,
        visitCount: i % 2 === 0 ? 5 : 500,
      });
      map.set(`h${i}.test`, {
        nodes: [i],
        hostVisitCount: i % 2 === 0 ? 5 : 500,
        host: `h${i}.test`,
      });
    }
    const bubbles = buildHostBubbles({
      bookmarkList: map,
      nodesList,
      width: 800,
      height: 2000,
    });
    expect(bubbles.length).toBe(20);
    // Пара с разным r не ближе суммы радиусов (сетка + jitter ≤5)
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dist = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
        expect(dist + 0.01).toBeGreaterThanOrEqual(a.r + b.r - 12);
      }
    }
  });

  it("visibleBubbles culls by scroll window", () => {
    const nodes = [
      { id: "a", y: 100, r: 40 },
      { id: "b", y: 2000, r: 40 },
    ] as any;
    const vis = visibleBubbles({
      nodes,
      scrollY: 0,
      viewH: 800,
      pad: 50,
    });
    expect(vis.map((n) => n.id)).toEqual(["a"]);
  });

  it("visibleBubbles keeps pinned / fx nodes", () => {
    const nodes = [
      { id: "far", y: 5000, r: 40 },
      { id: "pin", y: 5000, r: 40, fx: 100, fy: 5000 },
    ] as any;
    const byFx = visibleBubbles({
      nodes,
      scrollY: 0,
      viewH: 800,
      pad: 50,
    });
    expect(byFx.map((n) => n.id)).toEqual(["pin"]);
    const byId = visibleBubbles({
      nodes: [{ id: "far", y: 5000, r: 40 }] as any,
      scrollY: 0,
      viewH: 800,
      pad: 50,
      pinnedId: "far",
    });
    expect(byId.map((n) => n.id)).toEqual(["far"]);
  });

  it("pinBubbleAt clamps and sets fx/fy", async () => {
    const { pinBubbleAt, unpinBubble } = await import("./bubble-physics");
    const n = { id: "d", x: 0, y: 0, r: 40, vx: 3, vy: 4 } as any;
    pinBubbleAt(n, -100, 9999, 800, 560);
    expect(n.fx).toBe(44);
    expect(n.fy).toBe(560 - 44);
    expect(n.vx).toBe(0);
    unpinBubble(n);
    expect(n.fx).toBeNull();
    expect(n.fy).toBeNull();
  });

  it("clampBubblesToWorld keeps nodes inside the field", () => {
    const nodes = [
      { id: "out", x: -80, y: -50, r: 40 },
      { id: "ok", x: 400, y: 200, r: 40 },
    ] as any;
    clampBubblesToWorld(nodes, 800, 560);
    expect(nodes[0].x).toBeGreaterThanOrEqual(44);
    expect(nodes[0].y).toBeGreaterThanOrEqual(44);
    expect(nodes[0].x).toBeLessThanOrEqual(800 - 44);
    expect(nodes[1].x).toBe(400);
    expect(nodes[1].y).toBe(200);
  });

  it("worldHeightForCount uses grid packing not circle area", () => {
    // 400×800: rows*cell — не меньше сетки; не «короткая полоска»
    const h = worldHeightForCount(400, 800);
    const cell = 2 * 52 + 12;
    const cols = Math.floor(800 / cell);
    const rows = Math.ceil(400 / cols);
    expect(h).toBeGreaterThanOrEqual(rows * cell);
    expect(worldHeightForCount(200, 800)).toBeGreaterThan(
      worldHeightForCount(20, 800)
    );
    // 2000 hosts capped — высота как для 400, не раздувается
    expect(worldHeightForCount(2000, 800)).toBe(worldHeightForCount(400, 800));
    // minHeight поднимает низкие миры (preview)
    expect(worldHeightForCount(5, 800, { minHeight: 700 })).toBe(700);
  });

  it("clientToFieldPoint maps viewport to field without scroll double-count", async () => {
    const { clientToFieldPoint, fieldScrollFromRectTop } = await import(
      "./bubble-physics"
    );
    // Поле частично выше viewport (rect.top < 0) — scroll уже в top
    expect(
      clientToFieldPoint({
        clientX: 100,
        clientY: 50,
        fieldLeft: 0,
        fieldTop: -200,
      })
    ).toEqual({ x: 100, y: 250 });
    expect(fieldScrollFromRectTop(-200)).toBe(200);
    expect(fieldScrollFromRectTop(80)).toBe(0);
  });

  it("scrollDirection and assignEnterAnims map down→rise, up→fall", async () => {
    const { scrollDirection, assignEnterAnims } = await import(
      "./bubble-physics"
    );
    expect(scrollDirection(0, 40)).toBe(1);
    expect(scrollDirection(40, 0)).toBe(-1);
    expect(scrollDirection(10, 11)).toBe(0);
    const rise = assignEnterAnims({
      prevIds: ["a"],
      nextIds: ["a", "b"],
      scrollDir: 1,
      prevAnims: { a: "initial" },
    });
    expect(rise.a).toBe("initial");
    expect(rise.b).toBe("rise");
    const fall = assignEnterAnims({
      prevIds: ["b"],
      nextIds: ["b", "c"],
      scrollDir: -1,
    });
    expect(fall.c).toBe("fall");
  });

  it("offscreenEnterY is beyond viewport edges", async () => {
    const { offscreenEnterY } = await import("./bubble-physics");
    expect(
      offscreenEnterY({ anim: "rise", scrollY: 100, viewH: 800, r: 40 })
    ).toBeGreaterThan(100 + 800);
    expect(
      offscreenEnterY({ anim: "fall", scrollY: 100, viewH: 800, r: 40 })
    ).toBeLessThan(100);
  });

  it("separateBubbles pushes newcomers apart from locked anchors", async () => {
    const { separateBubbles } = await import("./bubble-physics");
    const nodes = [
      { id: "lock", x: 200, y: 200, r: 40, locked: true },
      { id: "new", x: 205, y: 200, r: 40, locked: false },
    ];
    separateBubbles(nodes, { width: 800, height: 600, iterations: 20 });
    const dist = Math.hypot(nodes[1].x - nodes[0].x, nodes[1].y - nodes[0].y);
    expect(dist).toBeGreaterThanOrEqual(80);
    expect(nodes[0].x).toBe(200);
  });

  it("flightPosition eases rise out and fall in", async () => {
    const { flightPosition } = await import("./bubble-physics");
    const rise = flightPosition(
      { anim: "rise", x0: 0, y0: 100, x1: 0, y1: 0 },
      0.5
    );
    const fall = flightPosition(
      { anim: "fall", x0: 0, y0: 0, x1: 0, y1: 100 },
      0.5
    );
    // easeOut: halfway time → past halfway distance toward target
    expect(rise.y).toBeLessThan(50);
    // easeIn: halfway time → less than halfway distance
    expect(fall.y).toBeLessThan(50);
  });

  it("inflateRadius interpolates grow and shrink", async () => {
    const {
      inflateRadius,
      GROUP_INFLATE_MS,
      GROUP_POP_MS,
      GROUP_SPAWN_LEAD_MS,
      GROUP_ABSORB_MS,
      GROUP_CHILD_SPAWN_AT_MS,
      GROUP_CHILD_FLUSH_AT_MS,
      GROUP_CHILD_STAGGER_MS,
    } = await import("./bubble-physics");
    expect(GROUP_INFLATE_MS).toBe(3000);
    expect(GROUP_POP_MS).toBe(680);
    expect(GROUP_SPAWN_LEAD_MS).toBe(140);
    expect(GROUP_ABSORB_MS).toBe(520);
    // Hover: 2с задержка → stagger → на 3с flush
    expect(GROUP_CHILD_SPAWN_AT_MS).toBe(2000);
    expect(GROUP_CHILD_FLUSH_AT_MS).toBe(3000);
    expect(GROUP_CHILD_STAGGER_MS).toBe(160);
    const {
      GROUP_EXPANDED_HOVER_GROW_MS,
      GROUP_EXPANDED_HOVER_SHRINK_MS,
    } = await import("./bubble-physics");
    expect(GROUP_EXPANDED_HOVER_GROW_MS).toBe(2400);
    expect(GROUP_EXPANDED_HOVER_SHRINK_MS).toBe(380);
    expect(inflateRadius(40, 90, 0)).toBe(40);
    expect(inflateRadius(40, 90, 1)).toBe(90);
    expect(inflateRadius(40, 90, 0.5)).toBeGreaterThan(65);
    // Unfold: сжатие groupR → linkR
    expect(inflateRadius(90, 40, 1)).toBe(40);
    expect(inflateRadius(90, 40, 0.5)).toBeLessThan(70);
  });

  it("absorbChildrenFrame pulls children in while parent grows", async () => {
    const { absorbChildrenFrame } = await import("./bubble-physics");
    const parent = { id: "host:a", x: 100, y: 100, r: 40 } as any;
    const child = { id: "c1", x: 200, y: 100, r: 30, vx: 1, vy: 1 } as any;
    absorbChildrenFrame({
      parent,
      starts: [{ node: child, x: 200, y: 100, r: 30 }],
      r0: 40,
      r1: 80,
      u: 1,
    });
    expect(parent.r).toBe(80);
    expect(child.x).toBe(100);
    expect(child.y).toBe(100);
    expect(child.r).toBe(2);
  });

  it("shrinkHostFrame returns parent toward weight radius", async () => {
    const { shrinkHostFrame } = await import("./bubble-physics");
    const parent = { r: 90 } as any;
    shrinkHostFrame({ parent, r0: 90, r1: 40, u: 1 });
    expect(parent.r).toBe(40);
  });

  it("expandedHostRadius grows room for children via area", async () => {
    const { expandedHostRadius, clusterRadiusFromChildRadii } = await import(
      "./bubble-physics"
    );
    expect(expandedHostRadius(40, 4)).toBeGreaterThan(40);
    expect(expandedHostRadius(40, 12)).toBeGreaterThanOrEqual(
      expandedHostRadius(40, 4)
    );
    // Площадь детей: два r=30 ≈ эквивалентный радиус > 40
    expect(
      clusterRadiusFromChildRadii({ childRadii: [30, 30, 30], r0: 40 })
    ).toBeGreaterThan(40);
  });

  it("expandHost spawns under parent, sets linkR/groupR, collapse restores groupR", async () => {
    const {
      buildHostBubbles,
      createBubbleWorld,
      expandHost,
      collapseHost,
      isHostExpanded,
      stopWorld,
    } = await import("./bubble-physics");
    const nodesList = [
      { url: "https://a.test/1", title: "a1", visitCount: 50 },
      { url: "https://a.test/2", title: "a2", visitCount: 5 },
      { url: "https://a.test/3", title: "a3", visitCount: 3 },
    ] as any;
    const bookmarkList = new Map([
      [
        "a.test",
        {
          nodes: [0, 1, 2],
          hostVisitCount: 58,
          hostLastVisitTime: 1,
        },
      ],
    ]);
    const hosts = buildHostBubbles({
      bookmarkList,
      nodesList,
      width: 800,
      height: 600,
    });
    const world = createBubbleWorld({ nodes: hosts, width: 800, height: 600 });
    const parent = world.nodes[0];
    const rBefore = parent.r;
    expect(parent.groupR).toBe(rBefore);
    expect(parent.linkR).toBeLessThan(parent.groupR!);
    expandHost({
      world,
      host: "a.test",
      childIndexes: [1, 2],
      nodesList,
    });
    expect(isHostExpanded(world, "a.test")).toBe(true);
    // Unfold: parent сжимается к linkR, не к cluster
    expect(parent.r).toBe(parent.linkR);
    expect(parent.r).toBeLessThan(rBefore);
    expect(parent.baseR).toBe(rBefore);
    expect(parent.groupR).toBe(rBefore);
    const kids = world.nodes.filter((n) => n.kind === "child");
    expect(kids.length).toBe(2);
    // Spawn под родителем (jitter ≤ 4); spawnIndex по порядку
    for (const k of kids) {
      expect(Math.abs((k.x ?? 0) - (parent.x ?? 0))).toBeLessThanOrEqual(5);
      expect(Math.abs((k.y ?? 0) - (parent.y ?? 0))).toBeLessThanOrEqual(5);
    }
    expect(kids.map((k) => k.spawnIndex).sort()).toEqual([0, 1]);
    // Повторный expandHost добавляет только новых (keepParentR)
    const rAfterFirst = parent.r;
    expandHost({
      world,
      host: "a.test",
      childIndexes: [1, 2],
      nodesList,
      keepParentR: true,
      spawnIndexBase: 2,
    });
    expect(world.nodes.filter((n) => n.kind === "child").length).toBe(2);
    expect(parent.r).toBe(rAfterFirst);
    collapseHost(world, "a.test");
    expect(isHostExpanded(world, "a.test")).toBe(false);
    expect(parent.r).toBe(rBefore);
    stopWorld(world);
  });

  it("expandHost incremental spawn with spawnIndexBase", async () => {
    const {
      buildHostBubbles,
      createBubbleWorld,
      expandHost,
      GROUP_MAX_CHILDREN,
      stopWorld,
    } = await import("./bubble-physics");
    expect(GROUP_MAX_CHILDREN).toBeGreaterThanOrEqual(100);
    const nodesList = [
      { url: "https://b.test/1", title: "b1", visitCount: 40 },
      { url: "https://b.test/2", title: "b2", visitCount: 4 },
      { url: "https://b.test/3", title: "b3", visitCount: 3 },
      { url: "https://b.test/4", title: "b4", visitCount: 2 },
    ] as any;
    const bookmarkList = new Map([
      [
        "b.test",
        {
          nodes: [0, 1, 2, 3],
          hostVisitCount: 49,
          hostLastVisitTime: 1,
        },
      ],
    ]);
    const hosts = buildHostBubbles({
      bookmarkList,
      nodesList,
      width: 800,
      height: 600,
    });
    const world = createBubbleWorld({ nodes: hosts, width: 800, height: 600 });
    const parent = world.nodes[0];
    const r0 = parent.r;
    // Первый ребёнок — keepParentR
    expect(
      expandHost({
        world,
        host: "b.test",
        childIndexes: [1],
        nodesList,
        keepParentR: true,
        spawnIndexBase: 0,
      })
    ).toBe(1);
    expect(parent.r).toBe(r0);
    expect(world.nodes.filter((n) => n.kind === "child")[0].spawnIndex).toBe(0);
    // Второй и третий пачкой
    expect(
      expandHost({
        world,
        host: "b.test",
        childIndexes: [2, 3],
        nodesList,
        keepParentR: true,
        spawnIndexBase: 1,
      })
    ).toBe(2);
    const kids = world.nodes.filter((n) => n.kind === "child");
    expect(kids.length).toBe(3);
    expect(kids.map((k) => k.spawnIndex).sort()).toEqual([0, 1, 2]);
    expect(parent.r).toBe(r0);
    stopWorld(world);
  });

  it("expandHost caps at GROUP_MAX_CHILDREN with overflow on last", async () => {
    const {
      buildHostBubbles,
      createBubbleWorld,
      expandHost,
      expandOverflowNode,
      GROUP_MAX_CHILDREN,
      stopWorld,
    } = await import("./bubble-physics");
    expect(GROUP_MAX_CHILDREN).toBe(100);
    const nodesList: any[] = [
      { url: "https://c.test/0", title: "c0", visitCount: 80 },
    ];
    for (let i = 1; i <= 150; i++) {
      nodesList.push({
        url: `https://c.test/${i}`,
        title: `c${i}`,
        visitCount: 2,
      });
    }
    const bookmarkList = new Map([
      [
        "c.test",
        {
          nodes: nodesList.map((_, i) => i),
          hostVisitCount: 300,
          hostLastVisitTime: 1,
        },
      ],
    ]);
    const hosts = buildHostBubbles({
      bookmarkList,
      nodesList,
      width: 800,
      height: 600,
    });
    const world = createBubbleWorld({ nodes: hosts, width: 800, height: 600 });
    const n = expandHost({
      world,
      host: "c.test",
      childIndexes: nodesList.map((_, i) => i).slice(1),
      nodesList,
    });
    // Ровно 100 прямых детей; последний — overflow с хвостом
    expect(n).toBe(100);
    const kids = world.nodes.filter((x) => x.kind === "child");
    expect(kids.length).toBe(100);
    const overflow = kids.find((k) => k.isOverflowGroup);
    expect(overflow).toBeTruthy();
    expect(overflow!.overflowCount).toBe(50);
    // Раскрыть overflow — ещё пачка
    const added = expandOverflowNode({
      world,
      parent: overflow!,
      nodesList,
    });
    expect(added).toBe(50);
    expect(world.nodes.filter((x) => x.kind === "child").length).toBe(150);
    stopWorld(world);
  });

  it("visibleBubbles keeps children even outside pad", async () => {
    const { visibleBubbles } = await import("./bubble-physics");
    const nodes = [
      { id: "host:a", kind: "host", y: 100, r: 40 },
      { id: "child:a:1", kind: "child", parentId: "host:a", y: 900, r: 20 },
    ] as any;
    const vis = visibleBubbles({ nodes, scrollY: 0, viewH: 200, pad: 40 });
    expect(vis.map((n) => n.id)).toContain("child:a:1");
    expect(vis.map((n) => n.id)).toContain("host:a");
  });

  it("collide keeps nodes from overlapping after ticks", async () => {
    const { createBubbleWorld, stopWorld } = await import("./bubble-physics");
    const nodes = [
      {
        id: "a",
        kind: "host" as const,
        host: "a",
        nodeIndex: 0,
        r: 40,
        visitCount: 1,
        title: "a",
        url: "https://a.test",
        spawnIndex: 0,
        x: 200,
        y: 200,
      },
      {
        id: "b",
        kind: "host" as const,
        host: "b",
        nodeIndex: 1,
        r: 40,
        visitCount: 1,
        title: "b",
        url: "https://b.test",
        spawnIndex: 1,
        x: 210,
        y: 200,
      },
    ];
    const world = createBubbleWorld({ nodes: nodes as any, width: 800, height: 600 });
    for (let i = 0; i < 50; i++) world.simulation.tick();
    const a = world.nodes[0];
    const b = world.nodes[1];
    const dist = Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.y ?? 0) - (b.y ?? 0));
    // drag-collisions: radius = r+1 → минимум ≈ r_i+r_j+2
    expect(dist).toBeGreaterThanOrEqual(a.r + b.r);
    stopWorld(world);
  });

  it("beginDragCollisions sets alphaTarget like d3 drag-collisions", async () => {
    const {
      createBubbleWorld,
      beginDragCollisions,
      endDragCollisions,
      beginSoftRadiusAdjust,
      endSoftRadiusAdjust,
      nudgeSim,
      stopWorld,
    } = await import("./bubble-physics");
    const nodes = [
      {
        id: "a",
        kind: "host" as const,
        host: "a",
        nodeIndex: 0,
        r: 20,
        visitCount: 1,
        title: "a",
        url: "https://a.test",
        spawnIndex: 0,
        x: 100,
        y: 100,
      },
    ];
    const world = createBubbleWorld({
      nodes: nodes as any,
      width: 400,
      height: 400,
    });
    beginDragCollisions(world);
    expect(world.simulation.alphaTarget()).toBe(0.18);
    // Links выкл — иначе drag схлопывает unfold к центру
    expect((world.linkForce.strength() as () => number)()).toBe(0);
    endDragCollisions(world);
    expect(world.simulation.alphaTarget()).toBe(0);
    expect((world.linkForce.strength() as () => number)()).toBe(0.35);
    // Soft radius: больше трения, низкая цель — без взрыва поля
    beginSoftRadiusAdjust(world);
    expect(world.simulation.alphaTarget()).toBe(0.05);
    expect(world.simulation.velocityDecay()).toBe(0.55);
    endSoftRadiusAdjust(world);
    expect(world.simulation.velocityDecay()).toBe(0.38);
    expect(world.simulation.alphaTarget()).toBe(0);
    world.simulation.alpha(0.01);
    nudgeSim(world, 0.1);
    expect(world.simulation.alpha()).toBeGreaterThanOrEqual(0.1);
    const before = world.simulation.alpha();
    nudgeSim(world, 0.05);
    expect(world.simulation.alpha()).toBe(before);
    stopWorld(world);
  });

  it("bounceBubblesAtWorldEdges keeps both left and right edges", () => {
    const nodes = [
      { id: "l", x: 2, y: 200, r: 40, vx: -5, vy: 0 },
      { id: "r", x: 900, y: 200, r: 40, vx: 5, vy: 0 },
    ] as any;
    bounceBubblesAtWorldEdges(nodes, 800, 560);
    // Левая и правая: центр не ближе r+4 к краю
    expect(nodes[0].x).toBe(44);
    expect(nodes[0].vx).toBeGreaterThan(0);
    expect(nodes[1].x).toBe(800 - 44);
    expect(nodes[1].vx).toBeLessThan(0);
  });

  it("bounceBubblesAtWorldEdges skips pinned drag subject, clamps free neighbor", () => {
    const pinned = {
      id: "drag",
      x: 10,
      y: 200,
      r: 40,
      vx: 0,
      vy: 0,
      fx: 10,
      fy: 200,
    } as any;
    const free = { id: "n", x: -20, y: 200, r: 30, vx: -8, vy: 0 } as any;
    bounceBubblesAtWorldEdges([pinned, free], 800, 560);
    // Закреплённый (drag) bounce не трогает — clamp делает pinBubbleAt
    expect(pinned.x).toBe(10);
    expect(free.x).toBe(34);
    expect(free.vx).toBeGreaterThan(0);
  });

  it("gridSpawnXY fills top-down with fixed cell", () => {
    const a = gridSpawnXY({ index: 0, count: 40, width: 800, height: 2400, r: 40 });
    const b = gridSpawnXY({ index: 20, count: 40, width: 800, height: 2400, r: 40 });
    expect(b.y).toBeGreaterThan(a.y);
    // Первый ряд ближе к верху, не к центру мира
    expect(a.y).toBeLessThan(200);
  });

  it("craterPullStep moves node toward target", async () => {
    const { craterPullStep } = await import("./bubble-physics");
    const node = { id: "n", x: 0, y: 0, r: 20 } as any;
    craterPullStep({ node, targetX: 100, targetY: 0, strength: 10 });
    expect(node.x).toBeGreaterThan(0);
    expect(node.x).toBeLessThan(100);
  });

  it("startCraterFill pulls distant child closer after ticks", async () => {
    const {
      createBubbleWorld,
      startCraterFill,
      stopWorld,
      GROUP_CRATER_FILL_MS,
    } = await import("./bubble-physics");
    expect(GROUP_CRATER_FILL_MS).toBe(920);
    const parent = {
      id: "host:a",
      kind: "host" as const,
      host: "a",
      nodeIndex: 0,
      r: 40,
      groupR: 60,
      visitCount: 1,
      title: "a",
      url: "https://a.test",
      spawnIndex: 0,
      x: 200,
      y: 200,
    };
    const child = {
      id: "child:a:1",
      kind: "child" as const,
      host: "a",
      nodeIndex: 1,
      r: 30,
      visitCount: 1,
      title: "c",
      url: "https://a.test/c",
      spawnIndex: 0,
      parentId: "host:a",
      x: 400,
      y: 200,
    };
    const world = createBubbleWorld({
      nodes: [parent, child] as any,
      width: 800,
      height: 600,
    });
    const dist0 = Math.hypot((child.x ?? 0) - 200, (child.y ?? 0) - 200);
    const stop = startCraterFill({ world, parent: parent as any, durationMs: 500 });
    world.simulation.alpha(1);
    for (let i = 0; i < 80; i++) world.simulation.tick();
    const dist1 = Math.hypot((child.x ?? 0) - (parent.x ?? 0), (child.y ?? 0) - (parent.y ?? 0));
    expect(dist1).toBeLessThan(dist0);
    stop();
    stopWorld(world);
  });

  it("createBubbleWorld uses forceY toward top of bubble block", async () => {
    const { createBubbleWorld, focusYForWorld, stopWorld, PACK_GAP, BUBBLE_GRAVITY } =
      await import("./bubble-physics");
    const nodes = [
      {
        id: "a",
        kind: "host" as const,
        host: "a",
        nodeIndex: 0,
        r: 40,
        visitCount: 1,
        title: "a",
        url: "https://a.test",
        spawnIndex: 0,
        x: 400,
        y: 500,
      },
    ];
    const world = createBubbleWorld({
      nodes: nodes as any,
      width: 800,
      height: 900,
    });
    expect(world.simulation.force("y")).toBeTruthy();
    const topY = focusYForWorld(900);
    expect(topY).toBeGreaterThan(PACK_GAP);
    expect(topY).toBeLessThan(200);
    // Пока гравитация выкл. — узел не обязан ехать вверх
    if (BUBBLE_GRAVITY) {
      world.simulation.alpha(1);
      const y0 = world.nodes[0].y ?? 500;
      for (let i = 0; i < 120; i++) world.simulation.tick();
      expect(world.nodes[0].y ?? 0).toBeLessThan(y0);
    }
    stopWorld(world);
  });

  it("focusYForWorld anchors to top of bubble block not page", async () => {
    const { focusYForWorld, PACK_GAP } = await import("./bubble-physics");
    const y = focusYForWorld(900);
    // Центр первого ряда ≈ pad + cell/2
    const pad = PACK_GAP + 8;
    const cell = 2 * 52 + PACK_GAP;
    expect(y).toBe(pad + cell * 0.5);
    expect(focusYForWorld(200)).toBeLessThanOrEqual(200 * 0.45 + 1);
  });
});
