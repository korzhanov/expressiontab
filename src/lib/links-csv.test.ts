import { describe, expect, it } from "bun:test";
import {
  CSV_HEADERS,
  csvExportFilename,
  escapeCsvField,
  parseLinksFromCsv,
  serializeLinksToCsv,
  splitCsvLine,
} from "./links-csv";
import type { BookmarkNode } from "./bookmarks";

describe("links-csv", () => {
  it("escapeCsvField quotes commas and doubles quotes", () => {
    expect(escapeCsvField("plain")).toBe("plain");
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("splitCsvLine respects quoted commas", () => {
    expect(splitCsvLine('https://a.com,"Hello, world",1')).toEqual([
      "https://a.com",
      "Hello, world",
      "1",
    ]);
  });

  it("serializeLinksToCsv writes header and skips bad urls", () => {
    const nodes: BookmarkNode[] = [
      {
        url: "https://example.com/x",
        title: "Ex, ample",
        visitCount: 3,
        lastVisitTime: 100,
        isBookmark: true,
      },
      { url: "chrome://settings", title: "nope" },
      { url: "", title: "empty" },
    ];
    const csv = serializeLinksToCsv(nodes);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(CSV_HEADERS.join(","));
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"Ex, ample"');
    expect(lines[1]).toContain("true");
  });

  it("parseLinksFromCsv round-trips and dedupes", () => {
    const csv = [
      "url,title,visitCount,lastVisitTime,isBookmark",
      "https://a.com/,Alpha,2,10,false",
      'https://b.com/,"Beta, B",5,20,true',
      "https://a.com/,dup,1,1,false",
      "javascript:alert(1),bad,1,1,false",
    ].join("\n");
    const rows = parseLinksFromCsv(csv);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({
      url: "https://a.com/",
      title: "Alpha",
      visitCount: 2,
      lastVisitTime: 10,
      isBookmark: false,
    });
    expect(rows[1].title).toBe("Beta, B");
    expect(rows[1].isBookmark).toBe(true);
  });

  it("parseLinksFromCsv works without header (url first)", () => {
    const rows = parseLinksFromCsv("https://z.dev/,Zed\nhttps://y.dev/,Y");
    expect(rows.length).toBe(2);
    expect(rows[0].url).toBe("https://z.dev/");
    expect(rows[0].title).toBe("Zed");
  });

  it("csvExportFilename has expressiontab-links prefix", () => {
    const name = csvExportFilename(new Date(2026, 8, 18, 12, 0, 0));
    expect(name).toBe("expressiontab-links-20260918.csv");
  });

  it("importLinksFromCsvText creates bookmarks", async () => {
    const created: { url: string; title: string }[] = [];
    const api = {
      bookmarks: {
        create(bookmark: { url?: string; title?: string }, cb?: () => void) {
          created.push({
            url: bookmark.url || "",
            title: bookmark.title || "",
          });
          cb?.();
        },
      },
    };
    const { importLinksFromCsvText } = await import("./links-csv");
    const result = await importLinksFromCsvText({
      text: "url,title\nhttps://in.test/,In\nchrome://x,skip",
      chromeApi: api,
    });
    expect(result.imported).toBe(1);
    expect(created[0].url).toBe("https://in.test/");
  });
});
