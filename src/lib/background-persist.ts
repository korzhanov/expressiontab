/**
 * Фон new-tab: большие data URL не влезают в localStorage (~5MB).
 * Пишем в chrome.storage.local (квота больше), store — только in-memory.
 */
import { writable, type Writable } from "svelte/store";

const LS_KEY = "background";
const CHROME_KEY = "background";

/** Целевой размер data URL (символы) — запас под другие ключи LS */
export const BACKGROUND_MAX_CHARS = 2_800_000;

export type BackgroundStorage = {
  local?: {
    get: (
      keys: string | string[] | null,
      cb: (items: Record<string, unknown>) => void
    ) => void;
    set: (items: Record<string, unknown>, cb?: () => void) => void;
  };
};

function storageGet(
  api: BackgroundStorage | undefined,
  key: string
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      if (!api?.local?.get) {
        resolve(null);
        return;
      }
      api.local.get(key, (items) => {
        const v = items?.[key];
        resolve(typeof v === "string" && v.length ? v : null);
      });
    } catch {
      resolve(null);
    }
  });
}

function storageSet(
  api: BackgroundStorage | undefined,
  key: string,
  value: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!api?.local?.set) {
        reject(new Error("no chrome.storage.local"));
        return;
      }
      api.local.set({ [key]: value }, () => {
        const err =
          typeof chrome !== "undefined"
            ? chrome.runtime?.lastError
            : undefined;
        if (err) reject(new Error(String(err.message || err)));
        else resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Прочитать фон: chrome.storage → localStorage (legacy persist) */
export async function loadBackgroundUrl(
  fallback: string,
  chromeApi?: BackgroundStorage
): Promise<string> {
  const api =
    chromeApi ??
    (typeof chrome !== "undefined" ? (chrome.storage as BackgroundStorage) : undefined);
  const fromChrome = await storageGet(api, CHROME_KEY);
  if (fromChrome) return fromChrome;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string" && parsed.length) return parsed;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** Сохранить фон: предпочтительно chrome.storage.local */
export async function saveBackgroundUrl(
  dataUrl: string,
  chromeApi?: BackgroundStorage
): Promise<void> {
  if (!dataUrl) throw new Error("empty background");
  const api =
    chromeApi ??
    (typeof chrome !== "undefined" ? (chrome.storage as BackgroundStorage) : undefined);
  try {
    await storageSet(api, CHROME_KEY, dataUrl);
    // Убрать старый persist из LS — освободить квоту
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* fallback LS только для маленьких */
  }
  if (dataUrl.length > BACKGROUND_MAX_CHARS) {
    throw new Error("Image too large for storage");
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(dataUrl));
  } catch (e) {
    throw new Error("Could not save background (storage full)");
  }
}

/** Svelte store + async hydrate */
export function createBackgroundStore(fallback: string): Writable<string> {
  return writable(fallback);
}
