<script lang="ts">
  /**
   * Tooltip для bubble-поля: не закрывается на scroll страницы
   * (поле высокое — иначе tip мгновенно умирает). Leave / ПКМ-меню — да.
   * image — twitter tip или cover, если уже в store.
   */
  import Tooltip from "./Tooltip.svelte";
  import type { TooltipSide } from "./portal";

  export let content: string = "";
  export let image: string = "";
  export let side: TooltipSide = "bottom";
  export let delayDuration: number = 400;
  export let block: boolean = false;
  export let disabled: boolean = false;
</script>

<Tooltip
  {content}
  {image}
  {side}
  {delayDuration}
  {block}
  {disabled}
  closeOnScroll={false}
>
  <slot />
</Tooltip>
