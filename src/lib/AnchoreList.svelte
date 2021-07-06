<script lang="ts">
    
	import { onMount, tick } from 'svelte';
    import AnchoreItem from "./AnchoreItem.svelte";
    export let bookmarks: any;

</script>

<!-- {@debug bookmarks} -->
 {#each bookmarks as bookmark,i }
    <!-- {@debug i}  -->
    {#if !!bookmark.children}
        <svelte:self bookmarks={bookmark.children} />
    {:else if !!bookmark.url}
        <AnchoreItem {...bookmark} />
    {/if}
{/each}


<style lang="postcss">
</style>
