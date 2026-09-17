<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import Keydown from "svelte-keydown";
  import { cubicOut, quintOut } from "svelte/easing";
  import { draw } from "svelte/transition";
  import VirtualScroll from "svelte-virtual-scroll-list";
  import HostItems from "./HostItems.svelte";
  import { filteredListSliced, nodesList, favicons } from "./stores";
  import { toDataURL } from "./utils";
  import {
    buildBookmarkIndex,
    makeChunks,
    enqueueFavicon,
    type HostGroup,
  } from "./bookmarks";
  import { isMockChrome } from "./chrome-mock";

  let online = true;
  let initialLoadDone = false;
  let searchInputEl: HTMLInputElement;
  const previewMock = isMockChrome();

  let searchTerm: string = localStorage.searchTerm || "";
  let favicon_localhost = localStorage.favicon_localhost;

  (async () => {
    // В preview (localhost) XHR к googleusercontent → CORS; в unpacked OK
    if (previewMock) return;
    if (!favicon_localhost || favicon_localhost?.length == 0) {
      favicon_localhost = await toDataURL(
        "https://s2.googleusercontent.com/s2/favicons?domain_url=http://localhost"
      );
      if (favicon_localhost) {
        localStorage.setItem("favicon_localhost", favicon_localhost);
      }
    }
  })();

  let bookmarkList: Map<string, HostGroup> = new Map(),
    bookmarkListSize: number = 0,
    loader: boolean = false,
    titleVisible = false,
    hh: number = 0,
    ww: number = 0,
    visible = 200,
    windowHeight: number = 0,
    windowWidth: number = 0;

  // Высота ряда ≈ max(anchorGroup с margin/border, крупные favicon) — без overflow:hidden
  $: rowEstimate = titleVisible ? 56 : 220;

  const titleVisibleStore = writable(false);
  setContext("titleVisible", titleVisibleStore);
  $: titleVisibleStore.set(titleVisible);
  $: visible = Math.ceil((hh * ww) / 50 / 50) || 200;

  async function getNodes(term: string): Promise<[any[], any[]]> {
    return Promise.all([
      new Promise((resolve) => {
        chrome.history.search(
          {
            text: term,
            startTime:
              new Date().getTime() -
              1000 * 60 * 60 * 24 * Math.max(7, term.length + 1),
            maxResults: 1000,
          },
          (results) => {
            resolve(results || []);
          }
        );
      }),
      chrome.bookmarks.search(term || "h"),
    ]);
  }

  async function getBookmarks() {
    const startTime = performance.now();
    loader = true;

    const s = await getNodes(searchTerm);
    const built = buildBookmarkIndex(s[0] || [], s[1] || []);
    bookmarkList = built.bookmarkList;
    nodesList.set(built.nodesList);
    localStorage.maxVisits = built.maxVisits + "";

    // Favicon queue только в расширении — в CursorBrowser CORS на s2.googleusercontent
    if (!previewMock) {
      for (const [host, group] of bookmarkList) {
        const node = built.nodesList[group.nodes[0]];
        if (node?.url) {
          enqueueFavicon(node.url, toDataURL, favicon_localhost).then((data) => {
            if (data) {
              favicons.update((map) => {
                map.set(host, data);
                return map;
              });
            }
          });
        }
      }
    }

    await rebuildChunks();
    loader = false;
    bookmarkListSize = bookmarkList.size;
    initialLoadDone = true;
    console.log(`getBookmarks took ${performance.now() - startTime}ms`);
  }

  async function rebuildChunks() {
    const startTime = performance.now();
    loader = true;
    const chankList = makeChunks(
      bookmarkList,
      $nodesList,
      windowWidth,
      titleVisible
    );
    filteredListSliced.set(chankList);
    loader = false;
    console.log(`makechanks took ${performance.now() - startTime}ms`);
  }

  let timer: ReturnType<typeof setTimeout>;
  $: newSearch(searchTerm);
  $: if (titleVisible !== undefined && bookmarkList.size) {
    rebuildChunks();
  }
  $: if (windowWidth && bookmarkList.size && initialLoadDone) {
    rebuildChunks();
  }

  async function newSearch(term: string) {
    const timeout = initialLoadDone ? 150 : 300;
    localStorage.searchTerm = term;
    clearTimeout(timer);
    loader = true;
    timer = setTimeout(() => {
      getBookmarks();
    }, timeout);
  }

  function clearSearch() {
    searchTerm = "";
    searchInputEl?.blur();
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      clearSearch();
    }
  }

  function onGlobalKey(e: CustomEvent) {
    // "/" focuses search when not typing in an input
    if (e.detail === "/" || e.detail === "Slash") {
      searchInputEl?.focus();
    }
  }

  onMount(() => {
    // focus search shortly after open for quicker filtering
    setTimeout(() => searchInputEl?.focus(), 100);
  });

  onDestroy(() => {
    clearTimeout(timer);
  });
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  bind:innerWidth={windowWidth}
  bind:online
/>

<filterBar class="text-white">
  {#if previewMock}
    <span class="previewBanner" title="Нет chrome.history — демо-данные">
      Preview · mock data
    </span>
  {/if}
  <input
    class="text-white"
    type="search"
    id="search"
    bind:this={searchInputEl}
    bind:value={searchTerm}
    on:keydown={onSearchKeydown}
    title="Type to filter. Esc clears. Press / to focus."
    placeholder="Search history & bookmarks"
    autocomplete="off"
  />
  <Keydown
    pauseOnInput
    on:Delete={clearSearch}
    on:Escape={clearSearch}
    on:key={onGlobalKey}
  />
  <label id="changeView" title={titleVisible ? "Bubble view" : "Lined list view"}>
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
  </label>
  <span class="status">
    {#if searchTerm}“{searchTerm}” · {/if}
    {bookmarkListSize} sites
    · last {searchTerm.length || 1} week{searchTerm.length > 1 ? "s" : ""}
  </span>
</filterBar>
<anchores bind:clientHeight={hh} bind:clientWidth={ww} class:titleVisible>
  <VirtualScroll
    let:data
    data={$filteredListSliced}
    key="key"
    pageMode={true}
    keeps={40}
    estimateSize={rowEstimate}
    topThreshold={2}
    bottomThreshold={2}
  >
    <div class="itemWrapper" class:lined={titleVisible} style:min-height="{rowEstimate}px">
      <HostItems value={data.value} />
    </div>
  </VirtualScroll>
  {#if loader}<loader><div class="lds-circle"><div /></div></loader>{/if}
</anchores>

<style>
  loader {
    margin: 0 auto;
    clear: left;
  }
  #search {
    background: rgb(20, 20, 20);
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
  #search::placeholder {
    color: #666;
    font-size: 22px;
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
    opacity: 1;
    z-index: 2;
  }
  filterBar .previewBanner {
    font-size: 11px;
    color: #f0c040;
    border: 1px solid #665522;
    border-radius: 4px;
    padding: 2px 8px;
    white-space: nowrap;
  }
  filterBar .status {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }
  anchores {
    display: block;
    box-sizing: border-box;
    position: relative;
    width: 100%;
    padding: 20px;
    height: auto;
    padding-top: 20px;
    z-index: 1;
    background: rgb(20, 20, 20);
  }
  anchores .itemWrapper {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: center;
    align-items: center;
    width: 100%;
    height: 220px;
    justify-content: center;
    box-sizing: border-box;
    /* visible — иначе круги с margin/scale обрезаются по mid-line */
    overflow: visible;
  }
  /* Обёртка virtual-scroll тоже не должна клипать */
  anchores :global(.virtual-scroll-item) {
    overflow: visible;
  }
  anchores .itemWrapper.lined {
    height: auto;
    min-height: 56px;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    align-content: stretch;
    overflow: visible;
  }

  .lds-circle {
    display: inline-block;
  }
  .lds-circle > div {
    display: inline-block;
    width: 40px;
    height: 40px;
    margin: 8px;
    background: center no-repeat url("../assets/icon32.png");
    background-size: contain;
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
</style>
