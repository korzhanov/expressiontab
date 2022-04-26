import { persist, indexedDBStorage } from "@macfja/svelte-persistent-store"
import { writable } from "svelte/store";

export const filteredListSliced = persist(writable([]),indexedDBStorage(),'filteredListSliced');
// export const chankList = writable([]);
export const favicons = writable(new Map());
export const nodesList = persist(writable([]),indexedDBStorage(),'nodesList');