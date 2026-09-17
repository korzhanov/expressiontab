import { describe, expect, it, mock } from "bun:test";
import { longhover } from "./longhover";

describe("longhover", () => {
  it("clears timer on destroy", () => {
    const listeners = new Map<string, EventListener>();
    const node = {
      addEventListener(type: string, fn: EventListener) {
        listeners.set(type, fn);
      },
      removeEventListener(type: string) {
        listeners.delete(type);
      },
      dispatchEvent: mock(() => true),
    } as unknown as HTMLElement;

    const action = longhover(node, 50);
    expect(listeners.has("mouseover")).toBe(true);
    action.destroy();
    expect(listeners.has("mouseover")).toBe(false);
    expect(listeners.has("mouseout")).toBe(false);
  });
});
