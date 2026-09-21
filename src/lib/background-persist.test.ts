import { describe, expect, it } from "bun:test";
import {
  loadBackgroundMeta,
  saveBackgroundMeta,
  saveBackgroundUrl,
  loadBackgroundUrl,
  type BackgroundStorage,
} from "./background-persist";

describe("background-persist", () => {
  it("saveBackgroundUrl prefers chrome.storage.local", async () => {
    const store: Record<string, unknown> = {};
    const api: BackgroundStorage = {
      local: {
        get: (keys, cb) => {
          const k = typeof keys === "string" ? keys : "background";
          cb({ [k]: store[k] });
        },
        set: (items, cb) => {
          Object.assign(store, items);
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

  it("saves and loads backgroundMeta", async () => {
    const store: Record<string, unknown> = {};
    const api: BackgroundStorage = {
      local: {
        get: (keys, cb) => {
          const k = typeof keys === "string" ? keys : Object.keys(keys || {})[0];
          cb({ [k]: store[k] });
        },
        set: (items, cb) => {
          Object.assign(store, items);
          cb?.();
        },
      },
    };
    await saveBackgroundMeta(
      {
        dayKey: "2026-09-21",
        source: "picsum",
        userLocked: false,
        copyright: "Photo by Jane / Lorem Picsum",
        creditUrl: "https://unsplash.com/@jane",
        title: "Picsum 2026-09-21",
      },
      api
    );
    const m = await loadBackgroundMeta(api);
    expect(m?.dayKey).toBe("2026-09-21");
    expect(m?.source).toBe("picsum");
    // Копирайт и ссылка переживают round-trip storage
    expect(m?.copyright).toBe("Photo by Jane / Lorem Picsum");
    expect(m?.creditUrl).toBe("https://unsplash.com/@jane");
    expect(m?.title).toBe("Picsum 2026-09-21");
  });
});
