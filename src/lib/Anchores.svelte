<script lang="ts">
   import { onMount } from "svelte";
   import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

   import AnchoreList from "./AnchoreList.svelte";
   // import VirtualList from "@sveltejs/svelte-virtual-list";
   import VirtualList from "./VirtualList.svelte";
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
   let bookmarkList: any = [],
      filteredListSliced: any = [];
   const bookmarks = promise.then(([a, b]) => {
      let c: any = [];
      a.sort((a1: any, a2: any) => {
         return a2.visitCount-a1.visitCount;
      });
      c = [...a, ...b];
      // console.log("a",a);
      // console.log("b",b);
      // console.log("c",c);
      // c.sort((c1: any, c2: any) => {
      //    return c1.url - c2.url;
      // });
      bookmarkList = c;
      return c;
   });

   let filteredList: any = bookmarkList;

   let start: number | undefined;
   let end: number | undefined;

   let searchTerm = "";
   $: if (searchTerm == "") {
      filteredList = [...bookmarkList];
   } else {
      // console.log("bookmarkList", bookmarkList);
      // console.log("filteredList", filteredList);
      // $:
      filteredList = bookmarkList.filter(
         (item: { url: string | string[], title: string | string[]}) =>
         (!!item.url && item.url.indexOf(searchTerm) !== -1) ||(!!item.title && item.title.indexOf(searchTerm) !== -1)
      );
   }
   let windowY: number,
      loaderY = 0,
      visible = 400,
      windowHeight:number =0,
      autoloader: any;
   // $: visible = filteredList?.length || 0;
   $: filteredListSliced = filteredList?.slice(
      0, 
      Math.min(visible, filteredList.length)
   );
   // $: loaderY = autoloader?.getBoundingClientRect().top;
   $: if (loaderY-300 <= windowY+windowHeight && visible<filteredList.length) {
      visible = visible + 150;
      // visible = Math.max(visible + 5, windowY);
   } 
   // else {
   //    visible = Math.max(visible - 70, 0);
   // }

   // var contentHeight = block.offsetHeight;      // 1) высота блока контента вместе с границами
   // var yOffset       = window.pageYOffset;      // 2) текущее положение скролбара
   // var window_height = window.innerHeight;      // 3) высота внутренней области окна документа
   // var y             = yOffset + window_height;

   // // если пользователь достиг конца
   // if(block.offsetHeight <=window.pageYOffset + window.innerHeight)

   onMount(() => {});
</script>

<input bind:value={searchTerm} />
{searchTerm}
<svelte:window bind:scrollY={windowY} bind:innerHeight={windowHeight} />
{windowHeight} - {windowY} - {loaderY}
<p>showing items {start}-{end}:{visible}</p>
<anchores bind:clientHeight={loaderY}>
   <!-- {@debug bookmarkList} -->
   <!-- {@debug filteredList} -->
   {@debug visible}
   {@debug loaderY}
   {@debug filteredListSliced}
   {#each filteredListSliced as item (item)}
      <AnchoreItem {...item} />
   {/each}
   <!-- <VirtualList items={filteredList} let:item bind:start bind:end>
            <AnchoreItem {...item} />
         </VirtualList> -->
</anchores>
   <!-- <autoloader bind:this={autoloader}>{loaderY}</autoloader> -->

<style lang="postcss">
   autoloader {
      display: block;
      position: relative;
      border: 1px solid #4ed400;
   }
   anchores {
      display: block;
      position: relative;
      /* height: 50vh; */
      width: 100%;
      bottom: 0;
      left: 0;
      /* min-height: 700px; */
      /* display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px; */
   }
   anchores svelte-virtual-list-contents {
      /* display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px; */
   }
   svelte-virtual-list-row {
      /* width: 40px;
      height: 40px; */
   }
</style>
