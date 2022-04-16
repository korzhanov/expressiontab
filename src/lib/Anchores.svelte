<script lang="ts">
  import { onMount, tick, setContext, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { tweened } from "svelte/motion";
  import { cubicOut, quintOut } from "svelte/easing";
  import { draw, fade } from "svelte/transition";
  // import TailwindCSS from "./TailwindCSS.svelte";

  // import AnchoreList from "./AnchoreList.svelte";
  // import VirtualList from "@sveltejs/svelte-virtual-list";
  // import VirtualList from "./VirtualList.svelte";
  import HostItem from "./HostItem.svelte";
  //  import {
  //         persist,
  //         indexedDBStorage
  //         ,localStorage
  //     } from "@macfja/svelte-persistent-store";

  //   let searchTerm = persist(writable(""), localStorage(), "searchTerm");
  let searchTerm:string = localStorage.searchTerm || "";

  // let searchTerm = "";
  // let bookmarkList: any = bookmarks.then((value) => value);
  let historyList: Array<any> = [],
    bookmarkList: Map<any, any> = new Map(),
    filteredListSliced: Array<any> = [],
    bookmarkListSize: number = 0,
    loader: boolean = false,
    titleVisible = false,
    windowY: number = 0,
    hh: number = 0,
    ww: number = 0,
    st: number = 0,
    oldwindowY: number = 0,
    visible = Math.ceil((hh * ww) / 50 / 50) || 200,
    windowHeight: number = 0,
    windowWidth: number = 0,
    autoloader: any;
  // let maxVisits = 1;
  // let filteredList: any = bookmarkList;

  // let start: number | undefined;
  // let end: number | undefined;
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
  async function getBookmarks() {
    console.log("get bookm searchTerm");
    console.log(searchTerm);
    // @todo фильтровать по имеющимся анкорам
    // @todo догружать по мере поиска по истории
    const promise = Promise.all([
      new Promise((resolve) => {
        chrome.history.search(
          {
            text: searchTerm,
            startTime:
              new Date().getTime() -
              1000 * 60 * 60 * 24 * 7 * (searchTerm.length + 1),
            maxResults: 2000,
          },
          (results) => {
            return resolve(results);
          }
        );
      }),
      chrome.bookmarks.search(searchTerm || "h"),
    ]);
    // const bookmarks = promise.then(([a, b]) => {
    const s = await promise;
    console.log("s bookmarks");
    console.log(s);
    // const bookmarks = promise.then(s => {
    // console.log(s);
    let a: any = s[0];
    let b: any = s[1];
    let c: any = [];
    // a.sort((a1: any, a2: any) => { // сортировочка
    //    return a2.visitCount - a1.visitCount;
    // });
    // c = [...a, ...b];
    let arr1Length = a.length;
    let arr2Length = b.length;
    a.length = arr1Length + arr2Length;
    for (let i = 0; i < arr2Length; i++) {
      a[arr1Length + i] = b[i];
      a[arr1Length + i].isBookmark = true;
    }
    b = [];
    arr1Length = a.length;
    bookmarkList = new Map();
    let maxVisits: number = 1;
    for (let i = 0; i < arr1Length; i++) {
      let host = "localhost";

      try {
        host = new URL(a[i].url).host.split(":")[0];

        if (bookmarkList.has(host)) {
          let bmitems = bookmarkList.get(host);
          bmitems[0].hostVisitCount =
            bmitems[0].hostVisitCount * 1 + (a[i].visitCount || 1);
          maxVisits = Math.max(maxVisits, bmitems[0].hostVisitCount);
          // console.log(a[i].url);
          // console.log("bmitems[0].hostVisitCount");
          // console.log(bmitems[0].hostVisitCount);
          bookmarkList.set(host, [...bmitems, a[i]]);
        } else {
          // console.log("a[i].visitCount");
          // console.log(a[i].visitCount);
          a[i].hostVisitCount = a[i].visitCount || 1;
          bookmarkList.set(host, [a[i]]);
        }
      } catch (e) {
        console.log(e);
        console.log("No favicon for url: ", a[i].url, a[i].title);
        // console.log(a[i]);
        // host = a[i].url;
      }
    }
    bookmarkListSize = bookmarkList.size;
    console.log("bookmarkList ready");
    // console.log(bookmarkList);
    localStorage.setItem("maxVisits", maxVisits + "");
    loadmore(true);
    // console.log("a",a);
    // console.log("b",b);
    // console.log("c",c);
    // c.sort((c1: any, c2: any) => {
    //    return c1.url - c2.url;
    // });
    // historyList = a;
    // bookmarkList = b;
    // maxVisits = maxVisits;
    // setContext('maxVisits', maxVisits);
    // bookmarkList = a;

    // return bookmarkList;
    // });
  }

  // let val='';
  let timer: any;

  // const debounce = v => {
  // 	clearTimeout(timer);
  // 	timer = setTimeout(() => {
  // 		val = v;
  // 	}, 750);
  // }

  $: {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // val = v;
      localStorage.setItem("searchTerm", searchTerm);
      console.log("searchTerm save");
      getBookmarks();
    }, 750);
  }
  async function loadmore(force: boolean = false) {
    // setContext('maxVisits', maxVisits);
    let pixel_offset: number = 200;

    if (
      (force ||
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - pixel_offset ||
        visible != bookmarkList.size) &&
      loader == false
    ) {
      console.log("loadmore render");

      loader = true;
      // console.log("bookmarkList", bookmarkList);

      let nowvisible = Math.ceil((hh * ww) / 50 / 50);
      let incrementVisible = 100;
      // console.log("old visible", visible);
      visible = Math.abs(
        Math.min(nowvisible + incrementVisible, bookmarkList.size)
      );
      // console.log("new visible", visible);
      //   filteredListSliced = bookmarkList.slice(0, visible);
      await tick();
      filteredListSliced = Array.from(bookmarkList).slice(0, visible);
      // console.log(filteredListSliced);
      // console.log(bookmarkList.size);
      await tick();
      loader = false;
    }
  }
  $: if (titleVisible) {
    visible = 20;
  } else {
    visible = 300;
  }

  let key;
  let keyCode;

  function handleKeydown(event:any) {
    key = event.key;
    keyCode = event.keyCode;
    switch (true) {
      case keyCode == 8:
        // backspace
        if (searchTerm.length > 0) {
          searchTerm = searchTerm.slice(0, -1);
        }
        break;
      case keyCode == 46:
        // delete
        searchTerm = "";
        break;
      case key.length == 1:
        searchTerm = searchTerm + key;
        break;
    }
  }

  onMount(() => {
    // loadmore(true);
  });

  onDestroy(() => {
    localStorage.setItem("maxVisits", "0");
  });
</script>

<svelte:window
  on:scroll={()=>loadmore(false)}
  bind:scrollY={windowY}
  bind:innerHeight={windowHeight}
  bind:innerWidth={windowWidth}
  on:keydown={handleKeydown}
/>
<!-- <p>showing items {start}-{end}:{visible}</p> -->
<filterBar class="text-white">
  <input class="text-white" type="search" id="search" bind:value={searchTerm} />
  <!-- on:keyup={({ target: { value } }) => debounce(value)}  -->
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
              easing: cubicOut,
            }}
          />
          <circle
            cx="12"
            cy="12"
            r="2"
            transition:draw={{
              duration: 200,
              delay: 200,
              easing: cubicOut,
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
              easing: cubicOut,
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
              easing: cubicOut,
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
              easing: quintOut,
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
              easing: cubicOut,
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
    {searchTerm}
    showing items {visible}
    of {bookmarkListSize}, last {searchTerm.length || 1} week{searchTerm.length >
    1
      ? "s"
      : ""}
    <!--, {windowHeight} -
      {windowY} - {hh} -->
  </span>
</filterBar>
<anchores bind:clientHeight={hh} bind:clientWidth={ww} class:titleVisible>
 
  {#each filteredListSliced as hostItem (hostItem)}
    <HostItem {hostItem} />
  {/each} 
  {#if loader}<loader><div class="lds-circle"><div /></div></loader>{/if}
  <!-- <anchor></anchor> -->
</anchores>

<!-- <autoloader bind:this={autoloader}>{hh}</autoloader> -->
<style>
  loader {
    clear: left;
  }
  #search {
    background: rgb(20 20 20);
    border: 0px;
    border-bottom: 2px solid #b5b5b5;
    height: 30px;
    width: 98%;
    text-align: center;
    font-size: 30px;
    padding: 10px 0px;
  }
  #search:focus {
    border-bottom: 2px solid #395e9d;
    outline: none;
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
    align-content: flex-end;
    align-items: center;
    position: relative;
    width: 100%;
    height: auto;
    /* min-height: 500px; */
    padding-top: 10px;
    z-index: 1;
    /* bottom: 0;
      left: 0; */
    /* margin-bottom: 40px; */
    background: rgb(20, 20, 20);
    justify-content: flex-start;

    /* min-height: 700px; */
    /* display: grid;
      grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
      gap: 5px; */
  }
  anchores:after {
    height: 100px;
    display: block;
    position: absolute;
    left: 0;
    content: "";
    background: linear-gradient(0deg, rgba(20, 20, 20, 0), rgba(20, 20, 20, 1));
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

  /* // :global(anchor) { */
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
  /* background-color: #fff; */
  /* width: 50px;
      height: 50px;
      border-radius: 50px;
      margin: 2px;
      background-color: rgb(31, 30, 30, 0.65);
      border: 10px solid transparent;
      text-overflow: ellipsis;
      display: block;
      position: relative;
      padding-right: 0px;
      box-sizing: border-box;
      animation: -global-width-grow-anchor 1s
      cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
      transition: all 0.3s ease; */
  /* overflow: hidden; */
  /* // } */
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
