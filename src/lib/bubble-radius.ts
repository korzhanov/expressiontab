/** Радиус пузырька от числа визитов — единый для packing/physics/UI. */

export const BUBBLE_R_MIN = 28;
export const BUBBLE_R_MAX = 88;

/**
 * Лог-шкала visits → радиус в [min, max].
 * RORO: принимает объект, возвращает число.
 */
export function bubbleRadiusFromVisits({
  visitCount,
  min = BUBBLE_R_MIN,
  max = BUBBLE_R_MAX,
}: {
  visitCount: number;
  min?: number;
  max?: number;
}): number {
  const v = Math.max(visitCount || 1, 1);
  // log10(1)=0 … log10(1000)≈3 → нормируем к 0…1 при ~1000 визитов
  const t = Math.min(Math.log10(v) / 3, 1);
  return Math.round(min + t * (max - min));
}

/** Диаметр для layout / collide. */
export function bubbleDiameter(radius: number): number {
  return radius * 2;
}
