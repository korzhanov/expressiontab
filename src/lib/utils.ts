export async function toDataURL(urll: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    // Короткий таймаут — мёртвые хосты не висят в Network минутами
    xhr.timeout = 4000;
    xhr.open("GET", urll, true);
    xhr.onload = function () {
      // 4xx/5xx — не читать blob как «успешную» иконку
      if (xhr.status < 200 || xhr.status >= 300) {
        resolve(undefined);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(xhr.response);
      reader.onloadend = function () {
        resolve((reader.result as string) || undefined);
      };
      reader.onerror = function () {
        resolve(undefined);
      };
    };
    // CORS/offline/timeout — тихо fallback (без throw в консоль приложения)
    xhr.onerror = function () {
      resolve(undefined);
    };
    xhr.ontimeout = function () {
      resolve(undefined);
    };
    xhr.responseType = "blob";
    xhr.send();
  });
}

export const ignoreUrl = [
  "chrome:",
  "chrome-extension:",
  "javascript:",
  "file:",
  "data:",
];

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Background opacity based on scroll position (0..1). */
export function bgOpacityFromScroll(
  scrollY: number,
  windowHeight: number
): number {
  if (!windowHeight) return 1;
  return clamp(1 - scrollY / windowHeight, 0, 1);
}
