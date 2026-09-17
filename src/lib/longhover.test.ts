import { describe, expect, it, mock } from "bun:test";
import { longhover, GROUP_LONGHOVER_MS } from "./longhover";

describe("longhover", () => {
  it("GROUP_LONGHOVER_MS is 3 seconds for group expand", () => {
    expect(GROUP_LONGHOVER_MS).toBe(3000);
  });

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

  it("fires longhover after duration", async () => {
    const dispatchEvent = mock(() => true);
    const listeners = new Map<string, EventListener>();
    const node = {
      addEventListener(type: string, fn: EventListener) {
        listeners.set(type, fn);
      },
      removeEventListener() {},
      dispatchEvent,
    } as unknown as HTMLElement;

    longhover(node, 30);
    listeners.get("mouseover")?.(new Event("mouseover"));
    await new Promise((r) => setTimeout(r, 50));
    expect(dispatchEvent).toHaveBeenCalled();
    const ev = (dispatchEvent.mock.calls[0] as unknown as [Event])[0];
    expect(ev.type).toBe("longhover");
  });
});
