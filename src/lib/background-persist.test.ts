import { describe, expect, it } from "bun:test";
import {
  BACKGROUND_MAX_CHARS,
  loadBackgroundUrl,
  saveBackgroundUrl,
  type BackgroundStorage,
} from "./background-persist";

describe("background-persist", () => {
  it("saveBackgroundUrl prefers chrome.storage.local", async () => {
    const store: Record<string, string> = {};
    const api: BackgroundStorage = {
      local: {
        get: (keys, cb) => {
          const k = typeof keys === "string" ? keys : "background";
          cb({ [k]: store[k] });
        },
        set: (items, cb) => {
          Object.assign(store, items as Record<string, string>);
          cb?.();
        },
      },
    };
    await saveBackgroundUrl("data:image/jpeg;base64,abc", api);
    expect(store.background).toBe("data:image/jpeg;base64,abc");
    expect(await loadBackgroundUrl("fallback", api)).toBe(
      "data:image/jpeg;base64,abc"
    );
  });

  it("exposes size budget constant", () => {
    expect(BACKGROUND_MAX_CHARS).toBeGreaterThan(1_000_000);
  });
});
