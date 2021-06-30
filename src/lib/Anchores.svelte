<script lang="ts">
   import { onMount } from "svelte";
   import AnchoreList from "./AnchoreList.svelte";
   import VirtualList from "@sveltejs/svelte-virtual-list";
   import AnchoreItem from "./AnchoreItem.svelte";

   // let historyTree: any = chrome.history.search(
   //    {
   //       text: "",
   //       startTime: new Date().getTime() - 1000 * 60 * 60 * 24 * 7,
   //       maxResults: 500
   //    },
   //    () => {}
   // );
   //  let bookmarkTree:any = chrome.bookmarks.search("h").then((f)=>{console.log("f", f); return(f)});
   // let bookmarkTree: any = chrome.bookmarks.search("h");

   // $: bookmarks = bookmarkTree.then((t: any) => {
   //    console.log("t", t);
   //    return t;
   // });

   const promise = Promise.all([
      new Promise(resolve => {
         chrome.history.search(
            {
               text: "",
               startTime: new Date().getTime() - 1000 * 60 * 60 * 24 * 7,
               maxResults: 500
            },
            results => {
               return resolve(results);
            }
         );
      }),
      chrome.bookmarks.search("h")
   ]);
   // let bookmarkList: any = bookmarks.then((value) => value);
   let bookmarkList: any = [];
   const bookmarks = promise.then(([a, b]) => {
      let c: any = [];
      a.sort((a1:any,a2:any)=>{return a1.visitCount-a2.visitCount});
      c = [...a, ...b];
      // console.log("a",a);
      // console.log("b",b);
      // console.log("c",c);
      bookmarkList = c;
      return c;
   });

      console.log("bookmarks",bookmarks);

      console.log("bookmarkList",bookmarkList);
   let filteredList: any = bookmarkList;
   // $: {
   //    console.log("bookmarks", bookmarks);
   //    console.log("bookmarkList", bookmarkList);
   //    console.log("filteredList", filteredList);
   // }
   //  let bookmarkTree:any = chrome.bookmarks.getTree();
   //  let bookmarks:any =bookmarkTree.then((result:any) => {
   //    return result;
   //    });

   let start: number | undefined;
   let end: number | undefined;

   let searchTerm = "";
   // $: if (searchTerm == "") {
   //    filteredList = [...bookmarkList];
   // } else {
   //    console.log("bookmarkList", bookmarkList);
   //    console.log("filteredList", filteredList);
   $: filteredList = bookmarkList.filter(
      (item: { url: string|string[]; }) => !!item.url && item.url.indexOf(searchTerm) !== -1
   );
   // }

   onMount(() => {});
</script>

<input bind:value={searchTerm} />
{searchTerm}

<p>showing items {start}-{end}</p>
<anchores>
   <!-- {#await bookmarkTree} -->

      <!-- {@debug bookmarks} -->
   <!-- {#await bookmarks} -->
      <!-- <div>Loading Bookmarks</div> -->
   <!-- {:then bookmarkList} -->
      {@debug bookmarkList}
      <!-- {@debug bookmarks} -->
      <!-- {#await filteredList then filtered} -->
         {@debug filteredList}

         <VirtualList items={filteredList} let:item bind:start bind:end>
            {@debug item}
            <AnchoreItem {...item} />
         </VirtualList>
      <!-- {/await} -->
      <!--    
	<VirtualList items={filteredList}let:item>
		<ListItem {...item}/>
	</VirtualList>
         <AnchoreList {bookmarks} />
	-->
   <!-- {/await} -->
</anchores>

<style lang="postcss">
   anchores {
      display: block;
      position: absolute;
      height: 50vh;
      width: 100%;
      bottom: 0;
      left: 0;
      /* display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px; */
   }
   anchores svelte-virtual-list-contents {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px;
   }
   svelte-virtual-list-row {
   width: 40px;
    height: 40px;
   }

</style>
