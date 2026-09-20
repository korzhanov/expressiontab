<script lang="ts">
  /**
   * Tooltip для lined/list (VirtualScroll pageMode):
   * на scroll закрываем — иначе pill висит после recycle ряда.
   */
  import Tooltip from "./Tooltip.svelte";
  import type { TooltipSide } from "./portal";

  export let content: string = "";
  export let side: TooltipSide = "bottom";
  export let delayDuration: number = 400;
  export let block: boolean = false;
  export let disabled: boolean = false;
</script>

<Tooltip
  {content}
  {side}
  {delayDuration}
  {block}
  {disabled}
  closeOnScroll={true}
>
  <slot />
</Tooltip>
