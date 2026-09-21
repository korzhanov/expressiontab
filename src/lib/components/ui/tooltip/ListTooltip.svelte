<script lang="ts">
  /**
   * Tooltip для lined/list (VirtualScroll pageMode):
   * на scroll закрываем — иначе pill висит после recycle ряда.
   * image — twitter/og tip, как у BubbleTooltip.
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
  closeOnScroll={true}
>
  <slot />
</Tooltip>
