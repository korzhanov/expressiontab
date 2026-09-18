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

  it("worldHeightForCount grows with sim count not full bookmark map", () => {
    expect(worldHeightForCount(200, 800)).toBeGreaterThan(
      worldHeightForCount(20, 800)
    );
    // 2000 hosts capped — высота как для 400, не раздувается
    expect(worldHeightForCount(2000, 800)).toBe(worldHeightForCount(400, 800));
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

  it("gridSpawnXY spreads indices vertically for tall world", () => {
    const a = gridSpawnXY({ index: 0, count: 40, width: 800, height: 2400, r: 40 });
    const b = gridSpawnXY({ index: 20, count: 40, width: 800, height: 2400, r: 40 });
    expect(b.y).toBeGreaterThan(a.y);
  });

  it("focusYForWorld stays in upper band", async () => {
    const { focusYForWorld } = await import("./bubble-physics");
    expect(focusYForWorld(900)).toBeLessThan(300);
    expect(focusYForWorld(560)).toBeGreaterThan(150);
  });
});
