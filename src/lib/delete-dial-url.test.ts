import { describe, expect, it } from "bun:test";
import { deleteDialUrl, type DeleteDialChrome } from "./delete-dial-url";

describe("deleteDialUrl", () => {
  it("removes bookmark by id and by url search, then history", async () => {
    const removed: string[] = [];
    const deletedUrls: string[] = [];
    const api: DeleteDialChrome = {
      bookmarks: {
        remove: (id, cb) => {
          removed.push(id);
          cb?.();
        },
        search: (_q, cb) => {
          cb([{ id: "99", url: "https://a.test/x" }]);
        },
      },
      history: {
        deleteUrl: (d, cb) => {
          deletedUrls.push(d.url);
          cb?.();
        },
      },
    };
    const r = await deleteDialUrl({
      chromeApi: api,
      url: "https://a.test/x",
      bookmarkId: "42",
    });
    expect(removed.sort()).toEqual(["42", "99"]);
    expect(deletedUrls).toEqual(["https://a.test/x"]);
    expect(r.historyDeleted).toBe(true);
    expect(r.removedBookmarkIds.sort()).toEqual(["42", "99"]);
  });

  it("still deletes history when not a bookmark", async () => {
    const deletedUrls: string[] = [];
    const api: DeleteDialChrome = {
      bookmarks: {
        remove: () => {},
        search: (_q, cb) => cb([]),
      },
      history: {
        deleteUrl: (d, cb) => {
          deletedUrls.push(d.url);
          cb?.();
        },
      },
    };
    await deleteDialUrl({ chromeApi: api, url: "https://b.test/", bookmarkId: null });
    expect(deletedUrls).toEqual(["https://b.test/"]);
  });

  it("skips non-http urls", async () => {
    const r = await deleteDialUrl({
      chromeApi: {},
      url: "chrome://settings",
    });
    expect(r.removedBookmarkIds).toEqual([]);
    expect(r.historyDeleted).toBe(false);
  });
});
