<script lang="ts">
  import HostItem from "./HostItem.svelte";

  export let value: any;
  export let key: any;
  export let width: any;
  // console.log("!!! hostItems !!! key", key);
//   console.log("!!! hostItems !!! width", width);
  // console.log("!!! hostItems !!! value", value);
</script>

{#each value as hostItem (hostItem.nodes[0])}
  <HostItem {hostItem} {key}/>
{/each}
