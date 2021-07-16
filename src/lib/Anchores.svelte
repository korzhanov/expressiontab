<script lang="ts">
   import { onMount, tick } from "svelte";
   import { tweened } from "svelte/motion";
   import { cubicOut, quintOut } from "svelte/easing";
   import { draw, fade } from "svelte/transition";
   import TailwindCSS from "./TailwindCSS.svelte";

   import AnchoreList from "./AnchoreList.svelte";
   // import VirtualList from "@sveltejs/svelte-virtual-list";
   import VirtualList from "./VirtualList.svelte";
   import AnchoreItem from "./AnchoreItem.svelte";

   let searchTerm = "";
   // let bookmarkList: any = bookmarks.then((value) => value);
   let bookmarkList: any = [],
      filteredListSliced: Array<any> = [];
   let loader = 0;
   let titleVisible = false;
   let filteredList: any = bookmarkList;

   let start: number | undefined;
   let end: number | undefined;
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
   $: {
      const promise = Promise.all([
         new Promise(resolve => {
            chrome.history.search(
               {
                  text: searchTerm,
                  startTime:
                     new Date().getTime() -
                     1000 * 60 * 60 * 24 * 7 * (searchTerm.length + 1),
                  maxResults: 2000
               },
               results => {
                  return resolve(results);
               }
            );
         }),
         chrome.bookmarks.search(searchTerm || "h")
      ]);
      const bookmarks = promise.then(([a, b]) => {
         let c: any = [];
         // a.sort((a1: any, a2: any) => { // сортировочка
         //    return a2.visitCount - a1.visitCount;
         // });
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
   }
   // $: filteredList = bookmarkList;
   $: filteredListSliced = bookmarkList.slice(0, visible);
   // $: if (searchTerm == "") {
   //    filteredListSliced = [...bookmarkList];
   //    // filteredList = [...bookmarkList];
   //    // filteredList = bookmarkList;
   // } else {
   //    // console.log("bookmarkList", bookmarkList);
   //    // console.log("filteredList", filteredList);
   //    // $:
   //    filteredListSliced = bookmarkList;
   //    // filteredList = bookmarkList;
   //    // filteredList = bookmarkList.filter( // фильтрация
   //    //    (item: { url: string | string[]; title: string | string[] }) =>
   //    //       (!!item.url && item.url.indexOf(searchTerm) !== -1) ||
   //    //       (!!item.title && item.title.indexOf(searchTerm) !== -1)
   //    // );
   //    // for (let i = 0; bookmarkList.length < i; i++) {
   //    //    filteredList = [];
   //    //    let item = bookmarkList[i];
   //    //    if (
   //    //       (!!item.url && item.url.indexOf(searchTerm) !== -1) ||
   //    //       (!!item.title && item.title.indexOf(searchTerm) !== -1)
   //    //    ) {
   //    //       filteredList = [...filteredList, item];
   //    //       // visible=Math.min(filteredList.length,500);
   //    //    }
   //    // }
   // }
   // const visible = tweened(1, {
   //    duration: 300,
   //    easing: cubicOut
   // });
   // visible.set(400);

   let windowY: number = 0,
      hh: number = 0,
      oldwindowY: number = 0,
      visible = 500,
      windowHeight: number = 0,
      autoloader: any;

   // $: visible = filteredList?.length || 0;

   // $: if (titleVisible) {
   //    visible = 20;
   // } else {
   //    visible = 500;
   // }

   // $: if (
   //    Math.abs(Math.min(Math.ceil(visible), filteredList.length)) <
   //    filteredListSliced.length
   // ) {
   //    tick();
   //    loader = 0;
   //    filteredListSliced.length = Math.max(
   //       Math.abs(Math.min(Math.ceil(visible), filteredList.length)),
   //       0
   //    );
   // } else {
   //    tick();
   //    loader = 0;
   //    filteredListSliced = filteredList?.slice(
   //       0,
   //       Math.abs(Math.min(Math.ceil(visible), filteredList.length))
   //    );
   // }
   // $: hh = autoloader?.getBoundingClientRect().top;
   // $: hh;
   $: if (
      hh - 300 < windowY + windowHeight &&
      oldwindowY - windowY != 0
      //  &&
      // visible < filteredList.length
   ) {
      console.log("hh - 300,windowY + windowHeight");
      console.log(hh - 300, windowY + windowHeight);

      // visible = Math.min(Math.ceil(visible + 20 + 1*(windowY-oldwindowY)),filteredList.length);
      loader = 1;
      visible = Math.abs(
         Math.min(
            Math.ceil(visible + 20 + 0.8 * (windowY - oldwindowY)),
            filteredList.length
         )
      );
      tick();
      // visible += v;
      console.log("windowY - oldwindowY");
      console.log(windowY - oldwindowY);
      oldwindowY = windowY;
   } else {
      loader = 0;
   }

   onMount(() => {});
</script>

<!-- {searchTerm} -->
<svelte:window bind:scrollY={windowY} bind:innerHeight={windowHeight} />
<!-- <p>showing items {start}-{end}:{visible}</p> -->
<filterBar class="text-white">
   <input class="text-white" id="search" bind:value={searchTerm} />
   <label id="changeView">
      <input type="checkbox" bind:checked={titleVisible} />
      <icon>
         <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-stop-circle"
         >
            {#if titleVisible}
               <circle
                  cx="12"
                  cy="12"
                  r="10"
                  transition:draw={{
                     duration: 500,
                     delay: 0,
                     easing: cubicOut
                  }}
               />
               <circle
                  cx="12"
                  cy="12"
                  r="2"
                  transition:draw={{
                     duration: 200,
                     delay: 200,
                     easing: cubicOut
                  }}
               />
               <rect
                  x="6"
                  y="6"
                  width="12"
                  height="12"
                  transition:draw={{
                     duration: 100,
                     delay: 0,
                     easing: cubicOut
                  }}
               />
            {:else}
               <line
                  x1="8"
                  y1="6"
                  x2="21"
                  y2="6"
                  transition:draw={{
                     duration: 300,
                     delay: 100,
                     easing: cubicOut
                  }}
               />
               <line
                  x1="8"
                  y1="12"
                  x2="21"
                  y2="12"
                  transition:draw={{
                     duration: 300,
                     delay: 200,
                     easing: quintOut
                  }}
               />
               <line
                  x1="8"
                  y1="18"
                  x2="21"
                  y2="18"
                  transition:draw={{
                     duration: 400,
                     delay: 200,
                     easing: cubicOut
                  }}
               />
               <line x1="3" y1="6" x2="3.01" y2="6" />
               <line x1="3" y1="12" x2="3.01" y2="12" />
               <line x1="3" y1="18" x2="3.01" y2="18" />
            {/if}
         </svg>
      </icon>

      <!-- <icon-list 
         in:fade="{{delay: 500, duration: 300}}"
         out:fade="{{delay: 200, duration: 300}}"
         > -->
      <!-- <svg
               xmlns="http://www.w3.org/2000/svg"
               width="24"
               height="24"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               stroke-width="2"
               stroke-linecap="round"
               stroke-linejoin="round"
               class="feather feather-list"
               ></svg
            > -->
      <!-- </icon-list>  -->
   </label>
   <span>
      showing items {visible}
      of {bookmarkList.length}, {windowHeight} - {windowY} - {hh}</span
   >
</filterBar>
<anchores bind:clientHeight={hh} class:titleVisible>
   <!-- {@debug bookmarkList} -->
   <!-- {@debug filteredListSliced} -->
   <!-- {#each bookmarkList as item (item)} -->
   {#each filteredListSliced as item (item)}
      <!-- <AnchoreItem {...item} {titleVisible} /> -->
      <AnchoreItem {...item} />
   {/each}
   <!-- <VirtualList items={filteredList} let:item bind:start bind:end>
            <AnchoreItem {...item} />
         </VirtualList> -->
   {#if { loader }}<loader><div class="lds-circle"><div /></div></loader>{/if}
   <!-- <anchor></anchor> -->
</anchores>

<!-- <autoloader bind:this={autoloader}>{hh}</autoloader> -->
<style lang="postcss">
   /* autoloader {
      display: block;
      position: relative;
      border: 1px solid #4ed400;
   } */
   #search {
      background: rgba(2, 2, 2, 0.2);
      border: 0px;
      border-bottom: 2px solid rgb(20, 20, 20);
      height: 30px;
   }
   #changeView input {
      opacity: 0;
      display: none;
   }
   .text-white {
      color: #fff;
   }
   filterBar {
      background: rgb(20, 20, 20);
      display: flex;
      position: relative;
      height: 80px;
      flex-direction: row;
      flex-wrap: wrap;
      align-content: space-around;
      justify-content: flex-start;
      align-items: center;
      gap: 10px;
      padding: 0 32px;
   }
   filterBar * {
      opacity: 0;
      transition: opacity 0.3s ease;
   }
   main:hover filterBar * {
      opacity: 1;
      transition: opacity 0.3s ease 2s;
   }
   /* filterBar:before {
      content: "";
      background: linear-gradient(
         180deg,
         rgba(20, 20, 20, 0),
         rgba(20, 20, 20, 1)
      );
      height: 100px;
      width: 100%;
      position: relative;
      display: block;
      left: 0;
      top: -100px;
   } */
   anchores {
      /* display: block; */
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      justify-content: center;
      align-content: flex-end;
      align-items: center;
      position: relative;
      width: 100%;
      height: auto;
      /* min-height: 500px; */
      padding-top: 10px;
      /* bottom: 0;
      left: 0; */
      /* margin-bottom: 40px; */
      background: rgb(20, 20, 20);

      /* min-height: 700px; */
      /* display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px; */
   }
   anchores:after {
      height: 50px;
      display: block;
      position: absolute;
      left: 0;
      content: "";
      background: linear-gradient(
         0deg,
         rgba(20, 20, 20, 0),
         rgba(20, 20, 20, 1)
      );
   }

   .lds-circle {
      display: inline-block;
      transform: translateZ(1px);
   }
   .lds-circle > div {
      display: inline-block;
      width: 40px;
      height: 40px;
      margin: 8px;
      border-radius: 50%;
      background: #fff;
      animation: lds-circle 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
   }
   @keyframes lds-circle {
      0%,
      100% {
         animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
      }
      0% {
         transform: rotateY(0deg);
      }
      50% {
         transform: rotateY(1800deg);
         animation-timing-function: cubic-bezier(0, 0.5, 0.5, 1);
      }
      100% {
         transform: rotateY(3600deg);
      }
   }

   :global(anchor) {
      /* float: left; */
      /* border-radius: 50%; */
      /* max-width: 300px; */
      /* clear: both; */
      /* padding: 2%; */
      /* display: inline-flex; */
      /* justify-content: center; */
      /* align-items: center; */
      /* background-color: #fff9;
        background-color: rgba(255, 255, 255, 0.5); */
      /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px); */
      /* background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        transition: all 0.3s ease; */
      width: 50px;
      height: 50px;
      border-radius: 50px;
      margin: 2px;
      background-color: #fff;
      border: 10px solid transparent;
      text-overflow: ellipsis;
      overflow: hidden;
      display: block;
      position: relative;
      padding-right: 0px;
      box-sizing: border-box;
      animation: -global-width-grow-anchor 1s
         cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
      transition: all 0.3s ease;
   }
   .titleVisible {
      flex-direction: row;
      flex-wrap: wrap;
   }

   .titleVisible :global(anchor) {
      width: 100% !important;
      padding: 10px !important;
      margin: 10px !important;
      border: 1px solid transparent !important;
      transform: scale(1) !important;
      /* display: block; */
      animation: -global-width-grow-anchor 1s
         cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
   }
   .titleVisible :global(anchor:nth-child(-n + 10)) {
      transition: transform cubic-bezier(0.23, 1, 0.32, 1), width 0.5s ease;
   }

   @keyframes -global-width-grow-anchor {
      0% {
         width: 50px;
         /* display: inline-block; */
      }
      100% {
         width: auto;
         /* display: block; */
      }
   }
</style>
