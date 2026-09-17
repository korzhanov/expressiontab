import { persist, indexedDBStorage } from "@macfja/svelte-persistent-store";
import { writable } from "svelte/store";

/** Row chunks for virtual scroll — in-memory only (rebuilt on each search). */
export const filteredListSliced = writable([]);

export const favicons = writable(new Map());

/** Flat list of history/bookmark nodes — persisted for faster cold start. */
export const nodesList = persist(writable([]), indexedDBStorage(), "nodesList");
