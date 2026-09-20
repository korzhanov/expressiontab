import { describe, expect, it } from "bun:test";
import {
  MAX_UNFOLDED_HOSTS,
  noteFoldedHost,
  noteUnfoldedHost,
} from "./unfold-limit";

describe("unfold-limit", () => {
  it("MAX_UNFOLDED_HOSTS is 3", () => {
    expect(MAX_UNFOLDED_HOSTS).toBe(3);
  });

  it("noteUnfoldedHost keeps at most max; oldest collapse first", () => {
    let order: string[] = [];
    let r = noteUnfoldedHost({ order, host: "a" });
    order = r.order;
    expect(r.toCollapse).toEqual([]);
    r = noteUnfoldedHost({ order, host: "b" });
    order = r.order;
    r = noteUnfoldedHost({ order, host: "c" });
    order = r.order;
    expect(order).toEqual(["a", "b", "c"]);
    // 4-й вытесняет самый старый
    r = noteUnfoldedHost({ order, host: "d" });
    expect(r.toCollapse).toEqual(["a"]);
    expect(r.order).toEqual(["b", "c", "d"]);
  });

  it("re-unfold moves host to end without collapsing others", () => {
    const r = noteUnfoldedHost({
      order: ["a", "b", "c"],
      host: "a",
    });
    expect(r.toCollapse).toEqual([]);
    expect(r.order).toEqual(["b", "c", "a"]);
  });

  it("noteFoldedHost removes host from order", () => {
    const r = noteFoldedHost({ order: ["a", "b", "c"], host: "b" });
    expect(r.order).toEqual(["a", "c"]);
  });
});
