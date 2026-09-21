import { describe, expect, it } from "bun:test";
import {
  cssUrlValue,
  dataUrlToObjectUrl,
  toCssBackgroundUrl,
} from "./background-display";

describe("background-display", () => {
  it("cssUrlValue wraps and escapes quotes", () => {
    expect(cssUrlValue("https://a.test/x.jpg")).toBe(
      'url("https://a.test/x.jpg")'
    );
    expect(cssUrlValue('data:image/jpeg;base64,ab"c')).toContain('\\"');
  });

  it("dataUrlToObjectUrl creates blob URL", () => {
    // 1x1 jpeg-ish minimal — use tiny png base64
    const tiny =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const url = dataUrlToObjectUrl(tiny);
    expect(url.startsWith("blob:")).toBe(true);
    URL.revokeObjectURL(url);
  });

  it("toCssBackgroundUrl uses blob for data URLs", () => {
    const tiny =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const { cssUrl, revoke } = toCssBackgroundUrl(tiny);
    expect(cssUrl.startsWith("blob:")).toBe(true);
    expect(revoke).toBe(cssUrl);
    if (revoke) URL.revokeObjectURL(revoke);
    const http = toCssBackgroundUrl("https://a.test/b.jpg");
    expect(http.cssUrl).toBe("https://a.test/b.jpg");
    expect(http.revoke).toBeNull();
  });
});
