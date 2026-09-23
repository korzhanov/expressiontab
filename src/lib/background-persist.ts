/**
 * Фон new-tab: большие data URL не влезают в localStorage (~5MB).
 * Пишем в chrome.storage.local (квота больше), store — только in-memory.
 */
import { writable, type Writable } from "svelte/store";
import { wallpaperDayKey } from "./wallpaper-sources";

const LS_KEY = "background";
const CHROME_KEY = "background";
const META_KEY = "backgroundMeta";

/** Целевой размер data URL (символы) — запас под другие ключи LS */
export const BACKGROUND_MAX_CHARS = 2_800_000;

export type BackgroundStorage = {
  local?: {
    get: (
      keys: string | string[] | Record<string, unknown> | null,
      cb: (items: Record<string, unknown>) => void
    ) => void;
    set: (items: Record<string, unknown>, cb?: () => void) => void;
  };
};

/** Мета фона: дневная ротация + lock после user drop */
export type BackgroundMeta = {
  dayKey: string;
  source: string;
  /** Пользователь поставил через drop — не перезаписывать daily */
  userLocked?: boolean;
  /** Копирайт базового изображения (XFactorial.com) */
  copyright?: string;
  /** Ссылка на источник / автора */
  creditUrl?: string;
  title?: string;
};

// Копирайт базового изображения из репо
export const DEFAULT_BG_COPYRIGHT = "Oleg Korzhanov, 2010"; // копирайт изображения из репо
export const DEFAULT_BG_CREDIT_URL = "https://XFactorial.com";

// Функция для получения ключа дня — не зависит от wallpaper-sources
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function storageGetRaw(
  api: BackgroundStorage | undefined,
  key: string
): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      if (!api?.local?.get) {
        resolve(null);
        return;
      }
      api.local.get(key, (items) => resolve(items?.[key] ?? null));
    } catch {
      resolve(null);
    }
  });
}

function storageSet(
  api: BackgroundStorage | undefined,
  items: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (!api?.local?.set) {
        reject(new Error("no chrome.storage.local"));
        return;
      }
      api.local.set(items, () => {
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

function defaultApi(
  chromeApi?: BackgroundStorage
): BackgroundStorage | undefined {
  return (
    chromeApi ??
    (typeof chrome !== "undefined"
      ? (chrome.storage as BackgroundStorage)
      : undefined)
  );
}

/** Прочитать фон: chrome.storage → localStorage (legacy persist) */
export async function loadBackgroundUrl(
  fallback: string,
  chromeApi?: BackgroundStorage
): Promise<string> {
  const api = defaultApi(chromeApi);
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
  const api = defaultApi(chromeApi);
  try {
    await storageSet(api, { [CHROME_KEY]: dataUrl });
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
  } catch {
    throw new Error("Could not save background (storage full)");
  }
}

export async function loadBackgroundMeta(
  chromeApi?: BackgroundStorage
): Promise<BackgroundMeta | null> {
  const api = defaultApi(chromeApi);
  const raw = await storageGetRaw(api, META_KEY);
  if (!raw || typeof raw !== "object") {
    // Если мета не сохранена — возвращаем копирайт базового изображения
    return {
      dayKey: wallpaperDayKey(),
      source: "user",
      userLocked: false,
      copyright: DEFAULT_BG_COPYRIGHT,
      creditUrl: DEFAULT_BG_CREDIT_URL,
      title: "Default background",
    };
  }
  const m = raw as BackgroundMeta;
  if (!m.dayKey || !m.source) return null;
  return m;
}

export async function saveBackgroundMeta(
  meta: BackgroundMeta,
  chromeApi?: BackgroundStorage
): Promise<void> {
  const api = defaultApi(chromeApi);
  try {
    await storageSet(api, { [META_KEY]: meta });
  } catch {
    /* meta необязательна при LS-only fallback */
  }
}

/** Svelte store + async hydrate */
export function createBackgroundStore(fallback: string): Writable<string> {
  return writable(fallback);
}
