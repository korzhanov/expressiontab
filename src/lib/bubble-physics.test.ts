import { describe, expect, it } from "bun:test";
import {
  BUBBLE_SIM_CAP,
  buildHostBubbles,
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

  it("worldHeightForCount grows with count", () => {
    expect(worldHeightForCount(200, 800)).toBeGreaterThan(
      worldHeightForCount(20, 800)
    );
  });
});
