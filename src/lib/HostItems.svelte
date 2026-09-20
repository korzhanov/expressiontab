<script lang="ts">
  import HostItem from "./HostItem.svelte";

  // value — хосты текущего ряда VirtualScroll ({...data} также даёт key/width — не нужны здесь)
  export let value: any;
</script>

{#each value || [] as hostItem (hostItem?.nodes?.[0] ?? hostItem)}
  <HostItem {hostItem} />
{/each}
