import { persist, indexedDBStorage } from "@macfja/svelte-persistent-store";
import { writable } from "svelte/store";
import type { BookmarkNode, ChunkRow } from "./bookmarks";

/** Row chunks for virtual scroll — in-memory only (rebuilt on each search). */
export const filteredListSliced = writable<ChunkRow[]>([]);

export const favicons = writable(new Map<string, string>());

/** Крупные og/apple-touch cover для фона больших / starred пузырей */
export const covers = writable(new Map<string, string>());

/** Flat list of history/bookmark nodes — persisted for faster cold start. */
export const nodesList = persist(
  writable<BookmarkNode[]>([]),
  indexedDBStorage(),
  "nodesList"
);
