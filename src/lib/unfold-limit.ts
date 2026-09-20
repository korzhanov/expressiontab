import { writable } from "svelte/store";

/**
 * Лимит одновременных unfolded-групп (bubble + lined).
 * Больше 3 → physics/DOM заметно тяжелеют.
 */

/** Сколько групп можно держать раскрытыми сразу */
export const MAX_UNFOLDED_HOSTS = 3;

/**
 * Зарегистрировать unfold: host в конец LRU.
 * Если сверх max — вернуть самых старых в toCollapse.
 */
export function noteUnfoldedHost({
  order,
  host,
  max = MAX_UNFOLDED_HOSTS,
}: {
  order: string[];
  host: string;
  max?: number;
}): { order: string[]; toCollapse: string[] } {
  if (!host) return { order: [...order], toCollapse: [] };
  // Уже раскрыт — подвинуть в конец (самый свежий)
  const without = order.filter((h) => h !== host);
  const next = [...without, host];
  const toCollapse: string[] = [];
  while (next.length > max) {
    const old = next.shift();
    if (old) toCollapse.push(old);
  }
  return { order: next, toCollapse };
}

/** Убрать host из LRU при ручном fold */
export function noteFoldedHost({
  order,
  host,
}: {
  order: string[];
  host: string;
}): { order: string[] } {
  if (!host) return { order: [...order] };
  return { order: order.filter((h) => h !== host) };
}

/** Lined: общий LRU unfolded host-ключей (HostItem подписан) */
export const unfoldedHostOrder = writable<string[]>([]);

/** Lined: раскрыть host; сверх лимита старые сами пропадут из store */
export function unfoldHost(host: string): void {
  if (!host) return;
  unfoldedHostOrder.update((order) => noteUnfoldedHost({ order, host }).order);
}

/** Lined: свернуть host */
export function foldHost(host: string): void {
  if (!host) return;
  unfoldedHostOrder.update(
    (order) => noteFoldedHost({ order, host }).order
  );
}

/** Сброс при пересборке dial / смене поиска */
export function clearUnfoldedHosts(): void {
  unfoldedHostOrder.set([]);
}
