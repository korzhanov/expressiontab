import { describe, expect, it } from "bun:test";
import {
  COVER_MIN_SIZE,
  MANIFEST_PATHS,
  absolutizeUrl,
  coverOriginHosts,
  isCoverWorthyUrl,
  manifestCandidateUrls,
  parseCoverIconUrls,
  parseTipImageUrls,
  parseManifestIcons,
  parseManifestLink,
  resolveTipImageSrc,
  shouldLoadCover,
} from "./cover-icons";

describe("parseCoverIconUrls", () => {
  it("prefers apple-touch-icon over og:image", () => {
    const html = `
      <meta property="og:image" content="/og.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple.png" />
      <link rel="icon" sizes="32x32" href="/small.ico" />
    `;
    const urls = parseCoverIconUrls(html, "https://ex.com/page");
    expect(urls[0]).toBe("https://ex.com/apple.png");
    expect(urls).toContain("https://ex.com/og.png");
    expect(urls.some((u) => u.includes("small.ico"))).toBe(false);
  });

  it("reads large rel=icon; twitter:image is tip-only not cover", () => {
    const html = `
      <meta name="twitter:image" content="https://cdn.ex.com/tw.jpg" />
      <link rel="icon" sizes="192x192" href="/pwa.png" />
    `;
    const covers = parseCoverIconUrls(html, "https://ex.com/");
    expect(covers).not.toContain("https://cdn.ex.com/tw.jpg");
    expect(covers).toContain("https://ex.com/pwa.png");
    const tips = parseTipImageUrls(html, "https://ex.com/");
    expect(tips).toContain("https://cdn.ex.com/tw.jpg");
  });

  it("absolutizeUrl resolves relative paths", () => {
    expect(absolutizeUrl("/a.png", "https://ex.com/x")).toBe(
      "https://ex.com/a.png"
    );
  });
});

describe("manifest first (quiet probe)", () => {
  it("coverOriginHosts adds parent domain", () => {
    expect(coverOriginHosts("app.foo.com")).toEqual([
      "app.foo.com",
      "foo.com",
    ]);
    expect(coverOriginHosts("foo.com")).toEqual(["foo.com"]);
  });

  it("manifestCandidateUrls: host then parent × paths", () => {
    const urls = manifestCandidateUrls("https://app.ex.com/page");
    expect(urls[0]).toBe("https://app.ex.com/manifest.json");
    expect(urls).toContain("https://app.ex.com/site.webmanifest");
    expect(urls).toContain("https://ex.com/manifest.json");
    expect(urls.length).toBe(2 * MANIFEST_PATHS.length);
  });

  it("parseManifestLink reads link rel=manifest", () => {
    const html = `<link rel="manifest" href="/app.webmanifest" />`;
    expect(parseManifestLink(html, "https://ex.com/")).toBe(
      "https://ex.com/app.webmanifest"
    );
  });

  it("parseManifestIcons prefers larger sizes and keeps SVG", () => {
    const urls = parseManifestIcons(
      {
        icons: [
          { src: "/i48.png", sizes: "48x48" },
          { src: "/i512.png", sizes: "512x512" },
          { src: "/i192.png", sizes: "192x192" },
          { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      "https://ex.com/manifest.json"
    );
    expect(urls[0]).toMatch(/logo\.svg|i512/);
    expect(urls).toContain("https://ex.com/logo.svg");
    expect(urls).toContain("https://ex.com/i512.png");
    expect(urls.some((u) => u.includes("i48"))).toBe(false);
  });
});

describe("isCoverWorthyUrl", () => {
  it("rejects favicon services and ico; allows svg and og", () => {
    expect(isCoverWorthyUrl("https://ex.com/favicon.ico")).toBe(false);
    expect(
      isCoverWorthyUrl(
        "chrome-extension://id/_favicon/?pageUrl=https://ex.com/&size=128"
      )
    ).toBe(false);
    expect(
      isCoverWorthyUrl(
        "https://s2.googleusercontent.com/s2/favicons?domain=ex.com&sz=64"
      )
    ).toBe(false);
    expect(isCoverWorthyUrl("https://ex.com/icon.svg")).toBe(true);
    expect(isCoverWorthyUrl("https://cdn.ex.com/og.png")).toBe(true);
  });
});

describe("shouldLoadCover", () => {
  it("loads for bookmarks and large radius", () => {
    expect(shouldLoadCover({ radius: 30, isBookmark: true })).toBe(true);
    expect(
      shouldLoadCover({ radius: COVER_MIN_SIZE / 2, isBookmark: false })
    ).toBe(true);
    expect(shouldLoadCover({ radius: 20, isBookmark: false })).toBe(false);
  });
});

describe("resolveTipImageSrc", () => {
  it("prefers tip (twitter) over cover", () => {
    const tips = new Map([["ex.com", "data:tip"]]);
    const covers = new Map([["ex.com", "data:cover"]]);
    expect(resolveTipImageSrc("ex.com", tips, covers, "")).toBe("data:tip");
    expect(resolveTipImageSrc("ex.com", new Map(), covers, "")).toBe(
      "data:cover"
    );
  });
});
