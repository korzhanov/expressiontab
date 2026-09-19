<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import { writable, get } from "svelte/store";
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
    type ChunkRow,
  } from "./bookmarks";
  import { isMockChrome } from "./chrome-mock";
  import { stashOpenTabs, loadOpenTabsForSession, mergeSessionIntoIndex, type StashChrome } from "./stash-tabs";
  import {
    downloadLinksCsv,
    importLinksFromCsvText,
    type ImportBookmarksChrome,
  } from "./links-csv";
  import * as Tooltip from "./components/ui/tooltip";
  import BubbleField from "./BubbleField.svelte";
  import {
    datesForPreset,
    draftDatesFromRange,
    formatHistoryRangeLabel,
    historySearchBounds,
    loadHistoryRangeFromStorage,
    saveHistoryRangeToStorage,
    type HistoryRangePreset,
    type HistoryRangeState,
  } from "./history-range";

  let online = true;
  let initialLoadDone = false;
  let searchInputEl: HTMLInputElement;
  const previewMock = isMockChrome();

  let searchTerm: string = localStorage.searchTerm || "";
  let favicon_localhost = localStorage.favicon_localhost;
  /** Диапазон history.search — пресеты + custom from–to */
  let historyRange: HistoryRangeState = loadHistoryRangeFromStorage();
  let rangePopoverOpen = false;
  // Date inputs сразу с датами текущего пресета
  let rangeDraftFrom = historyRange.fromDate;
  let rangeDraftTo = historyRange.toDate;

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

  // VirtualScroll slot data — типизируем для HostItems
  function chunkRowValue(data: unknown): HostGroup[] {
    return (data as ChunkRow).value;
  }

  // Высота ряда ≈ max(anchorGroup с margin/border, крупные favicon) — без overflow:hidden
  $: rowEstimate = titleVisible ? 48 : 220;

  const titleVisibleStore = writable(false);
  setContext("titleVisible", titleVisibleStore);
  $: titleVisibleStore.set(titleVisible);
  $: visible = Math.ceil((hh * ww) / 50 / 50) || 200;

  async function getNodes(
    term: string
  ): Promise<[chrome.history.HistoryItem[], chrome.bookmarks.BookmarkTreeNode[]]> {
    const { startTime, endTime } = historySearchBounds(historyRange);
    return Promise.all([
      new Promise<chrome.history.HistoryItem[]>((resolve) => {
        chrome.history.search(
          {
            text: term,
            startTime,
            endTime,
            maxResults: 2500,
          },
          (results) => {
            resolve(results || []);
          }
        );
      }),
      chrome.bookmarks.search(term || "h"),
    ]);
  }

  function setHistoryPreset(preset: HistoryRangePreset) {
    // Пресет + даты для date inputs (сегодня/вчера/недели)
    const dates = datesForPreset(preset);
    historyRange = { preset, fromDate: dates.fromDate, toDate: dates.toDate };
    rangeDraftFrom = dates.fromDate;
    rangeDraftTo = dates.toDate;
    saveHistoryRangeToStorage(historyRange);
    rangePopoverOpen = false;
    getBookmarks();
  }

  function applyCustomRange() {
    historyRange = {
      preset: "custom",
      fromDate: rangeDraftFrom,
      toDate: rangeDraftTo,
    };
    saveHistoryRangeToStorage(historyRange);
    rangePopoverOpen = false;
    getBookmarks();
  }

  $: rangeStatusLabel = formatHistoryRangeLabel(historyRange);

  async function getBookmarks() {
    const startTime = performance.now();
    loader = true;

    const s = await getNodes(searchTerm);
    let built = buildBookmarkIndex(s[0] || [], s[1] || []);

    // Открытые вкладки — сверху как session-группа (другой цвет)
    const api = stashChrome();
    if (api && !searchTerm.trim()) {
      try {
        const session = await loadOpenTabsForSession(api);
        if (session) {
          const merged = mergeSessionIntoIndex({
            bookmarkList: built.bookmarkList,
            nodesList: built.nodesList,
            session,
          });
          built = {
            ...built,
            bookmarkList: merged.bookmarkList,
            nodesList: merged.nodesList,
          };
        }
      } catch (err) {
        console.error(err);
      }
    }

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
  /** Идёт перенос вкладок в закладки */
  let stashBusy = false;
  /** Короткий статус после переноса */
  let stashNote = "";
  /** CSV import: скрытый file input */
  let csvFileInput: HTMLInputElement;
  let csvBusy = false;

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

  /** chrome.tabs + bookmarks — без permission `tabs`, URL даёт `<all_urls>`. */
  function stashChrome(): StashChrome | null {
    try {
      if (
        typeof chrome !== "undefined" &&
        typeof chrome.tabs?.query === "function" &&
        typeof chrome.bookmarks?.create === "function"
      ) {
        return chrome as unknown as StashChrome;
      }
    } catch {
      // preview без mock tabs
    }
    return null;
  }

  async function onStashTabs(allWindows: boolean) {
    if (stashBusy) return;
    const api = stashChrome();
    if (!api) {
      stashNote = "Need Chrome extension";
      return;
    }
    const scope = allWindows ? "all tabs" : "tabs in this window";
    if (!confirm(`Save to bookmarks and close ${scope}?`)) return;
    stashBusy = true;
    stashNote = "";
    try {
      const result = await stashOpenTabs({ allWindows, chromeApi: api });
      if (!result.bookmarked) {
        stashNote = "No tabs to move";
      } else {
        stashNote = `Moved ${result.bookmarked}`;
        await getBookmarks();
      }
    } catch (err) {
      console.error(err);
      stashNote = "Failed to move tabs";
    } finally {
      stashBusy = false;
    }
  }

  /** chrome.bookmarks для CSV-импорта (в т.ч. preview mock). */
  function importChrome(): ImportBookmarksChrome | null {
    try {
      if (
        typeof chrome !== "undefined" &&
        typeof chrome.bookmarks?.create === "function"
      ) {
        return chrome as unknown as ImportBookmarksChrome;
      }
    } catch {
      // нет API
    }
    return null;
  }

  /** Export текущего dial (nodesList) в CSV-файл. */
  function onExportCsv() {
    const nodes = get(nodesList) || [];
    const { rows } = downloadLinksCsv({ nodes });
    stashNote = rows ? `CSV · ${rows} links` : "CSV · empty";
  }

  function onImportCsvClick() {
    if (csvBusy) return;
    if (!importChrome()) {
      stashNote = "Need chrome.bookmarks";
      return;
    }
    csvFileInput?.click();
  }

  async function onCsvFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const api = importChrome();
    if (!api) {
      stashNote = "Need chrome.bookmarks";
      return;
    }
    csvBusy = true;
    stashNote = "CSV · import…";
    try {
      const text = await file.text();
      const { imported, skipped } = await importLinksFromCsvText({
        text,
        chromeApi: api,
      });
      stashNote = skipped
        ? `CSV · +${imported}, пропуск ${skipped}`
        : `CSV · +${imported}`;
      if (imported) await getBookmarks();
    } catch (err) {
      console.error(err);
      stashNote = "CSV · import error";
    } finally {
      csvBusy = false;
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
  <div class="filterRow searchRow">
    {#if previewMock}
      <Tooltip.Root
        content="No chrome.history — mock data"
        side="bottom"
        delayDuration={300}
      >
        <span class="previewBanner">Preview · mock data</span>
      </Tooltip.Root>
    {/if}
      <input
        class="text-white"
        type="search"
        id="search"
        bind:this={searchInputEl}
        bind:value={searchTerm}
        on:keydown={onSearchKeydown}
        placeholder="Search history & bookmarks"
        autocomplete="off"
      />
  </div>
  <Keydown
    pauseOnInput
    on:Delete={clearSearch}
    on:Escape={clearSearch}
    on:key={onGlobalKey}
  />
  <div class="filterRow actionsRow">
    <div class="stashBtns">
      <Tooltip.Root
        content="Save tabs in this window to bookmarks and close"
        side="bottom"
        delayDuration={350}
      >
        <button
          type="button"
          class="stashBtn"
          disabled={stashBusy}
          on:click={() => onStashTabs(false)}
        >
          move the window tabs
        </button>
      </Tooltip.Root>
      <Tooltip.Root
        content="Save tabs in all windows to bookmarks and close"
        side="bottom"
        delayDuration={350}
      >
        <button
          type="button"
          class="stashBtn"
          disabled={stashBusy}
          on:click={() => onStashTabs(true)}
        >
          move all tabs
        </button>
      </Tooltip.Root>
      <Tooltip.Root
        content="Download current dial links to CSV"
        side="bottom"
        delayDuration={350}
      >
        <button
          type="button"
          class="stashBtn"
          disabled={csvBusy}
          on:click={onExportCsv}
        >
          export csv
        </button>
      </Tooltip.Root>
      <Tooltip.Root
        content="Import links from CSV to bookmarks"
        side="bottom"
        delayDuration={350}
      >
        <button
          type="button"
          class="stashBtn"
          disabled={csvBusy}
          on:click={onImportCsvClick}
        >
          import csv
        </button>
      </Tooltip.Root>
      <!-- Скрытый input: выбор .csv для импорта -->
      <input
        bind:this={csvFileInput}
        type="file"
        accept=".csv,text/csv"
        class="csvFileInput"
        on:change={onCsvFileChange}
      />
    </div>
    <span class="status">
      {#if searchTerm}“{searchTerm}” · {/if}
      {bookmarkListSize} sites ·
      <button
        type="button"
        class="rangeTrigger"
        aria-expanded={rangePopoverOpen}
        on:click={() => {
          rangePopoverOpen = !rangePopoverOpen;
          // Всегда подставить актуальные даты в inputs
          const draft = draftDatesFromRange(historyRange);
          rangeDraftFrom = draft.fromDate;
          rangeDraftTo = draft.toDate;
        }}
      >
        {rangeStatusLabel}
      </button>
      {#if stashNote} · {stashNote}{/if}
    </span>
    {#if rangePopoverOpen}
      <div class="rangePopover" role="dialog" aria-label="History date range">
        <div class="rangePresets">
          <button type="button" on:click={() => setHistoryPreset("today")}>Today</button>
          <button type="button" on:click={() => setHistoryPreset("yesterday")}>Yesterday</button>
          <button type="button" on:click={() => setHistoryPreset("1w")}>1 week</button>
          <button type="button" on:click={() => setHistoryPreset("4w")}>4 weeks</button>
          <button type="button" on:click={() => setHistoryPreset("12w")}>12 weeks</button>
          <button type="button" on:click={() => setHistoryPreset("all")}>All time</button>
        </div>
        <div class="rangeCustom">
          <label>
            From
            <input type="date" bind:value={rangeDraftFrom} />
          </label>
          <label>
            To
            <input type="date" bind:value={rangeDraftTo} />
          </label>
          <button type="button" class="rangeApply" on:click={applyCustomRange}>Apply</button>
        </div>
      </div>
    {/if}
    <Tooltip.Root
      content={titleVisible ? "Bubble view" : "Lined list view"}
      side="bottom"
      delayDuration={350}
    >
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
                  easing: quintOut,
                }}
              />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            {/if}
          </svg>
        </icon>
      </label>
    </Tooltip.Root>
  </div>
</filterBar>
<anchores bind:clientHeight={hh} bind:clientWidth={ww} class:titleVisible>
  {#if titleVisible}
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
      <div class="itemWrapper lined" style:min-height="{rowEstimate}px">
        <HostItems value={chunkRowValue(data)} />
      </div>
    </VirtualScroll>
  {:else if bookmarkList.size && $nodesList.length}
    <!-- Bubble field: d3-force + viewport cull (lined выше) -->
    <BubbleField
      {bookmarkList}
      nodesList={$nodesList}
      width={windowWidth || ww || 800}
    />
  {/if}
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
    box-sizing: border-box;
    height: 40px;
    width: 100%;
    text-align: center;
    font-size: 22px;
    line-height: 1.2;
    padding: 4px 0 6px;
  }
  /* Поиск в своей строке — не width:98%, иначе кнопки уезжают под placeholder */
  filterBar .searchRow :global(.tooltip-root.block) {
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
  }
  #search:focus {
    border-bottom: 2px solid #395e9d;
    outline: none;
  }
  #search::placeholder {
    color: #666;
    font-size: 18px;
  }
  #changeView {
    margin-left: auto;
    flex-shrink: 0;
    cursor: pointer;
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
    height: auto;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 8px;
    padding: 10px 32px 12px;
    opacity: 1;
    z-index: 10;
  }
  filterBar .filterRow {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }
  filterBar .actionsRow {
    flex-wrap: wrap;
    position: relative;
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
    flex: 1 1 auto;
    min-width: 0;
  }
  filterBar .rangeTrigger {
    background: none;
    border: none;
    color: #b5c4e0;
    font-size: inherit;
    padding: 0 2px;
    cursor: pointer;
    text-decoration: underline;
    text-decoration-style: dotted;
  }
  filterBar .rangeTrigger:hover {
    color: #fff;
  }
  filterBar .rangePopover {
    position: absolute;
    right: 32px;
    bottom: calc(100% + 6px);
    z-index: 20;
    background: rgb(28, 28, 32);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 280px;
  }
  filterBar .rangePresets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  filterBar .rangePresets button,
  filterBar .rangeApply {
    background: rgba(255, 255, 255, 0.06);
    color: #ddd;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
  }
  filterBar .rangePresets button:hover,
  filterBar .rangeApply:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  filterBar .rangeCustom {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    font-size: 11px;
    color: #aaa;
  }
  filterBar .rangeCustom label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  filterBar .rangeCustom input[type="date"] {
    background: rgb(20, 20, 20);
    border: 1px solid #444;
    color: #eee;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 11px;
  }
  filterBar .stashBtns {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    position: relative;
    z-index: 3;
  }
  filterBar .stashBtn {
    background: rgba(255, 255, 255, 0.06);
    color: #ddd;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.2;
    cursor: pointer;
    white-space: nowrap;
  }
  filterBar .stashBtn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.28);
    color: #fff;
  }
  filterBar .stashBtn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  filterBar .csvFileInput {
    display: none;
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
    min-height: 48px;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    align-content: stretch;
    overflow: visible;
    gap: 2px;
    padding: 4px 8px;
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
