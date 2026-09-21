import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  claimActiveTooltip,
  clampTooltipPos,
  closeActiveTooltip,
  placeTooltip,
  releaseActiveTooltip,
  resetActiveTooltip,
  TOOLTIP_LAYER_ID,
} from "./portal";

function rect(partial: {
  top: number;
  left: number;
  width: number;
  height: number;
}) {
  const { top, left, width, height } = partial;
  return {
    getBoundingClientRect: () => ({
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {
        return {};
      },
    }),
  };
}

describe("placeTooltip", () => {
  const el = rect({ top: 100, left: 50, width: 80, height: 40 });

  it("anchors below the trigger", () => {
    expect(placeTooltip(el, "bottom")).toEqual({ top: 146, left: 90 });
  });

  it("anchors above the trigger", () => {
    expect(placeTooltip(el, "top")).toEqual({ top: 94, left: 90 });
  });

  it("anchors to the left / right", () => {
    expect(placeTooltip(el, "left")).toEqual({ top: 120, left: 44 });
    expect(placeTooltip(el, "right")).toEqual({ top: 120, left: 136 });
  });
});

describe("clampTooltipPos", () => {
  it("keeps a bottom pill inside the viewport", () => {
    const clamped = clampTooltipPos(
      { top: 200, left: 40 },
      "bottom",
      { width: 320, height: 30 },
      400,
      600,
      8
    );
    expect(clamped.left).toBeGreaterThanOrEqual(8 + 160);
    expect(clamped.left).toBeLessThanOrEqual(400 - 8 - 160);
  });
});

describe("claimActiveTooltip singleton", () => {
  it("closes the previous owner when a new one claims", () => {
    resetActiveTooltip();
    let closedA = 0;
    claimActiveTooltip(() => {
      closedA += 1;
    });
    claimActiveTooltip(() => {});
    expect(closedA).toBe(1);
  });

  it("release only clears matching token", () => {
    resetActiveTooltip();
    let closed = 0;
    const t1 = claimActiveTooltip(() => {
      closed += 1;
    });
    releaseActiveTooltip(t1);
    claimActiveTooltip(() => {});
    expect(closed).toBe(0);
  });

  it("closeActiveTooltip invokes and clears the active closer", () => {
    resetActiveTooltip();
    let closed = 0;
    claimActiveTooltip(() => {
      closed += 1;
    });
    closeActiveTooltip();
    expect(closed).toBe(1);
    // Повторный вызов — no-op
    closeActiveTooltip();
    expect(closed).toBe(1);
  });
});

describe("tooltip layer id", () => {
  it("uses a stable layer id for the portal", () => {
    expect(TOOLTIP_LAYER_ID).toBe("expressiontab-tooltip-layer");
  });
});

describe("tooltipPortal destroy policy", () => {
  it("does not removeChild in action.destroy (Svelte detach owns it)", () => {
    const src = readFileSync(join(import.meta.dir, "portal.ts"), "utf8");
    expect(src).not.toContain("flushTooltipLayer(null)");
    // destroy action — пустой; не вызывает removeChild сам
    const destroyBlock = src.match(/return \{\s*destroy\(\) \{([\s\S]*?)\},\s*\};/);
    expect(destroyBlock?.[1] ?? "").not.toContain("removeChild");
    expect(destroyBlock?.[1] ?? "").not.toContain(".remove(");
  });
});
