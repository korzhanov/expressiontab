<script lang="ts">
    import { onMount } from 'svelte';
    import AnchoreItem from "./AnchoreItem.svelte"
    // $: hour = date.getHours();
     let bookmarks = chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    // $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
      });
    
    onMount( () => {
     
    });
   </script>

<section class="anchores">
   <AnchoreItem  href="http://google.com" />
</section>

<style lang="postcss">
    
</style>
