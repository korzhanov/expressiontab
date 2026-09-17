export async function toDataURL(urll: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", urll, true);
    xhr.onload = function () {
      const reader = new FileReader();
      reader.readAsDataURL(xhr.response);
      reader.onloadend = function () {
        resolve(reader.result as string);
      };
    };
    // CORS/offline — просто fallback (в CursorBrowser preview googleusercontent блокируется)
    xhr.onerror = function () {
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
