import { describe, expect, it } from "bun:test";
import {
  extractImgSrcFromHtml,
  looksLikeImageUrl,
  parseImageDrop,
} from "./image-drop";

describe("image-drop", () => {
  it("looksLikeImageUrl accepts http(s) and data:image", () => {
    expect(looksLikeImageUrl("https://cdn.example/a.jpg")).toBe(true);
    expect(looksLikeImageUrl("data:image/png;base64,aa")).toBe(true);
    expect(looksLikeImageUrl("ftp://x/a.png")).toBe(false);
    expect(looksLikeImageUrl("")).toBe(false);
  });

  it("extractImgSrcFromHtml reads img src", () => {
    expect(
      extractImgSrcFromHtml('<img src="https://x.test/p.png" alt="">')
    ).toBe("https://x.test/p.png");
  });

  it("parseImageDrop prefers image File", () => {
    const file = new File([new Uint8Array([1, 2])], "a.png", {
      type: "image/png",
    });
    const src = parseImageDrop({
      files: [file],
      getData: () => "https://ignored.test/x.jpg",
    });
    expect(src?.kind).toBe("file");
    if (src?.kind === "file") expect(src.file.name).toBe("a.png");
  });

  it("parseImageDrop reads uri-list then html", () => {
    const fromUri = parseImageDrop({
      files: [],
      getData: (fmt) =>
        fmt === "text/uri-list" ? "https://cdn.test/bg.webp\n" : "",
    });
    expect(fromUri).toEqual({
      kind: "url",
      url: "https://cdn.test/bg.webp",
    });

    const fromHtml = parseImageDrop({
      files: [],
      getData: (fmt) =>
        fmt === "text/html"
          ? '<meta><img src="https://cdn.test/from-html.jpg">'
          : "",
    });
    expect(fromHtml).toEqual({
      kind: "url",
      url: "https://cdn.test/from-html.jpg",
    });
  });

  it("parseImageDrop returns null without image payload", () => {
    expect(
      parseImageDrop({
        files: [],
        getData: () => "not-a-url",
      })
    ).toBeNull();
  });
});
