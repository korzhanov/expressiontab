export function longhover(
  node: HTMLElement,
  duration = 1500
): { update: (newDuration: number) => void; destroy: () => void } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timer: any | null = null;

  const handleMouseover = () => {
    clearTimeout(timer);
    // Долгое наведение → CustomEvent longhover
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent("longhover"));
    }, duration);
  };

  const handleMouseout = () => {
    clearTimeout(timer);
    timer = null;
  };

  node.addEventListener("mouseover", handleMouseover);
  node.addEventListener("mouseout", handleMouseout);

  return {
    update(newDuration: number): void {
      duration = newDuration;
    },
    destroy(): void {
      clearTimeout(timer);
      timer = null;
      node.removeEventListener("mouseover", handleMouseover);
      node.removeEventListener("mouseout", handleMouseout);
    },
  };
}

/** Удержание курсора перед раскрытием группы ссылок домена */
export const GROUP_LONGHOVER_MS = 3000;
