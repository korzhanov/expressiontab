<script lang="ts">
  import { onMount, tick, setContext, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { tweened } from "svelte/motion";
  import Keydown from "svelte-keydown";
  import { cubicOut, quintOut } from "svelte/easing";
  import { draw, fade } from "svelte/transition";
  // import VirtualList from "@sveltejs/svelte-virtual-list";
  // import VirtualList from "./VirtualList.svelte";
  // import InfiniteScroll from "svelte-infinite-scroll";
  import VirtualScroll from "svelte-virtual-scroll-list";
  import HostItem from "./HostItem.svelte";
  import HostItems from "./HostItems.svelte";
  import { filteredListSliced, nodesList } from "./stores";
  import { toDataURL, ignoreUrl } from "./utils";

  let online = true;
  let persistloading = true;
  let page = 0;
  let size = 200;

  let searchTerm: string = localStorage.searchTerm || "";
  let favicon_localhost = localStorage.favicon_localhost;

  (async () => {
    if (!favicon_localhost || favicon_localhost?.lenth == 0) {
      favicon_localhost = await toDataURL(
        "https://s2.googleusercontent.com/s2/favicons?domain_url=http://localhost"
      );
      localStorage.setItem("favicon_localhost", favicon_localhost);
    }
  })();

  let historyList: Array<any> = [],
    bookmarkList: Map<any, any> = new Map(),
    // filteredListSliced: Array<any> = [],
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

  async function getNodes(searchTerm: string): Promise<any> {
    return Promise.all([
      // получаем историю посещений
      new Promise((resolve) => {
        chrome.history.search(
          {
            text: searchTerm, // запрос для поиска
            startTime:
              new Date().getTime() -
              1000 * 60 * 60 * 24 * Math.max(7, searchTerm.length + 1), // последние 7 дней или по количеству символов
            maxResults: 1000, // максимальное количество результатов
          },
          (results) => {
            return resolve(results); // возвращаем результат
          }
        );
      }),
      chrome.bookmarks.search(searchTerm || "h"), // получаем массив закладок по запросу или по всем ссылкообразным закладкам если нет запроса
    ]);
  }

  async function getBookmarks() {
    const startTime = performance.now();

    //
    console.log("get bookmark searchTerm", searchTerm);
    loader = true;
    // @todo фильтровать по имеющимся анкорам
    // @todo догружать по мере поиска по истории

    const s = await getNodes(searchTerm); // получаем массив из двух объектов
    // let a: any = s[0]; // первый объект истории
    // let b: any = s[1]; // второй объект закладок
    let arr1Length = s[0].length; // длина массива истории
    let arr2Length = s[1].length; // длина массива закладок
    bookmarkList = new Map(); // очищаем карту анкоров
    let newNodesList = []; // очищаем карту нод
    let maxVisits: number = 1; // максимальное количество посещений
    // оптимизировать проход по массивам, совместить вычисления в один проход по длине массива

    // let chankList: Array<any> = []; // массив чанков для отображения
    for (let i = 0; i < arr1Length + arr2Length; i++) {
      // перебираем массив истории и закладок

      let c: any;
      if (i >= arr1Length) {
        // если перебираем закладки
        c = s[1][i - arr1Length]; // получаем элемент закладки
        c.isBookmark = true; // добавляем поле обозначающее что это закладка
      } else c = s[0][i]; // получаем элемент истории
      if (!c.url) {
        continue;
      }
      let host = "localhost"; // хост по умолчанию
      // если url начинается на префикс из приведенных в списке ignoreUrl , то удаляем этот элемент из массива
      try {
        let ignore = false;
        ignoreUrl.map((item) => {
          if (c?.url?.startsWith(item)) {
            ignore = true;
          }
        });
        if (ignore) {
          continue;
        }
      } catch (error) {
        console.error(error);
      }

      try {
        // попытка получить хост из адреса
        host = new URL(c.url).host.split(":")[0]; // получаем хост
        c.host = host; // добавляем поле хоста в объект
        // c.img_data = online
        //   ? // ? "https://s2.googleusercontent.com/s2/favicons?domain_url=" + encodeURIComponent(c.url)
        //     "https://favicon.yandex.net/favicon/" + host
        //   : localStorage.getItem("favicon_" + host);
        if (bookmarkList.has(host)) {
          // если хост уже есть в карте
          let bmitems = bookmarkList.get(host); // получаем массив анкоров для хоста
          bmitems.hostVisitCount = (bmitems.hostVisitCount ? bmitems.hostVisitCount * 1 : 1) + (c.visitCount || 1); // увеличиваем количество посещений хоста
          maxVisits = Math.max(maxVisits, bmitems.hostVisitCount); // получаем максимальное количество посещений
          c.weightVisits = Math.log10(
            Math.max(c.visitCount || 1, c.hostVisitCount || 1)
          ); // получаем вес посещений
          // c.weightVisitsRadius = c.weightVisits * 10 + 10 + 50; // получаем примерный радиус анкора в зависимисти от веса посещений
          bmitems.weightVisits = bmitems.weightVisits
            ? bmitems.weightVisits * 1
            : 1 + c.weightVisits; // увеличиваем вес посещений хоста
          bmitems.weightVisitsRadius =
            Math.ceil(bmitems.weightVisits * 10) + 10 + 50; // получаем примерный радиус анкора в зависимисти от веса посещений
          // bmitems.push(c); // добавляем в массив анкоров для хоста
          bmitems.nodes.push(newNodesList.length); // добавляем в массив анкоров для хоста
          bookmarkList.set(host, bmitems); // добавляем в карту анкоров
          // bookmarkList.set(host, [...bmitems, c]); // добавляем в карту анкоров
        } else {
          // если хоста нет в карте
          // console.log("c",c);
          c.hostVisitCount = c.visitCount || 1; // присваиваем количество посещений
          c.weightVisits = Math.log10(c.hostVisitCount); // получаем вес посещений
          // console.log("c.weightVisits",c.weightVisits);
          c.weightVisitsRadius = Math.ceil(c.weightVisits * 10) + 10 + 50; // получаем примерный радиус анкора в зависимисти от веса посещений
          // bookmarkList.set(host, [c]); // добавляем в карту анкоров
          bookmarkList.set(host, { nodes: [newNodesList.length] }); // добавляем в карту анкоров
        }
        newNodesList.push(c);
      } catch (e) {
        // если не удалось получить хост
        console.error(e);
        console.log("Link without host: ", c.url, c.title);
      }
    }
    await makechanks();
    // console.log("chankList",chankList);
    loader = false; // закончили загрузку
    bookmarkListSize = bookmarkList.size; // получаем длину карты анкоров
    localStorage.maxVisits = maxVisits + ""; // сохраняем максимальное количество посещений
    console.log(`getBookmarks took ${performance.now() - startTime}ms`);
  }

  // разбиваем на чанки

    const startTime = performance.now();
    loader = true; // начали рендер

    // разбиваем bookmarkList на чанки по длине окна и радиусу анкоров
    let chankList: Array<any> = [];

    let ik = 1;

    bookmarkList.forEach((value, key, map) => {
      const last = chankList[chankList.length - 1];
      // let value = bookmarkList.get(key);
      // console.log("last");
      // console.log("key",key);
      // console.log("value");
      // console.log(value);
      console.log("last.width,last.width+130,windowWidth");
      console.log(last?.width, last?.width + 130, windowWidth - 50);
      if (
        !last ||
        // last.width + value[0].weightVisitsRadius * 2 >= windowWidth
        last.width + 130 >= windowWidth - 100
      ) {
        chankList.push({
          key: ik,
          value: [value],
          // width: value[0].weightVisitsRadius * 2,
          width: 130,
        });
        // console.log("value[0].weightVisitsRadius * 2",value[0].weightVisitsRadius * 2);
        // console.log("last.width",last.width);
        // console.log("last",last);
        console.log("newline");
      } else {
        last.value.push(value);
        // last.width = last.width * 1 + value[0].weightVisitsRadius * 2;
        last.width = last.width * 1 + 130;
        // console.log("value[0].weightVisitsRadius * 2",value[0].weightVisitsRadius * 2);
        // console.log("last.width",last.width);
        // console.log("last",last);
        console.log("add last");
      }
      console.log(last);
      ik++;
      console.log("chankList", chankList);
    });
    filteredListSliced.set(chankList); // получаем массив анкоров из карты анкоров
    // console.log("chankList", JSON.stringify(chankList));
    loader = false; // закончили загрузку

    // filteredListSliced.set(Array.from(bookmarkList)); // получаем массив анкоров из карты анкоров
    console.log(`makechanks took ${performance.now() - startTime}ms`);
  }

  async function storeFavicon(url: string) {
    try {
      let host = new URL(url).host.split(":")[0];
      setTimeout(async () => {
        let fav = localStorage.getItem("favicon_" + host);
        if (!fav?.length) {
          const promises = Promise.all([
            toDataURL("http://www.google.com/s2/favicons?domain=" + host),
            toDataURL("https://favicon.yandex.net/favicon/" + host),
            //   toDataURL("chrome://favicon2/?size=16&scale_factor=1x&page_url=" +encodeURIComponent(hostAnchore.url)),
            toDataURL(
              "https://s2.googleusercontent.com/s2/favicons?domain_url=" + url
            ),
          ]);
          let datas = await promises;
          // перебираем все полученные иконки
          datas.forEach((data: any) => {
            if (data && data.length && data !== favicon_localhost) {
              fav = data;
            }
          });
          if (fav) localStorage.setItem("favicon_" + host, fav);
        }
      }, 10000);
    } catch (e) {
      console.log("No favicon for url: ", e);
    }
  }

  // let val='';
  let timer: any;
  $: newSearch(searchTerm);

  async function newSearch(searchTerm: string) {
    let timeout = 1050;
    if (!persistloading) {
      persistloading = false;
      timeout = 3000;
    }
      console.log("searchTerm", searchTerm);
      localStorage.searchTerm = searchTerm; // сохраняем поисковый запрос в локальное хранилище
      // filteredListSliced.set([]);
      clearTimeout(timer); // очищаем таймер
      timer = setTimeout(() => {
        // запускаем таймер
        getBookmarks(); // запускаем загрузку анкоров
      }, timeout); // задержка в мс перед загрузкой анкоров
  }

  onMount(() => {
    // loadmore(true);
  });

  onDestroy(() => {
    // localStorage.setItem("maxVisits", "0");
    filteredListSliced.set($filteredListSliced.slice(0,200));
    console.log("destroy anchores");
  });
</script>

<!-- 
  on:scroll={() => onScroll()}
  on:keyup={handleKeyup}-->
<svelte:window
  bind:scrollY={windowY}
  bind:innerHeight={windowHeight}
  bind:innerWidth={windowWidth}
  bind:online
/>
<!-- <p>showing items {start}-{end}:{visible}</p> -->
<filterBar class="text-white">
  <input
    class="text-white"
    type="search"
    id="search"
    bind:value={searchTerm}
    title="Press Esc or Del to clear"
  />
  <Keydown
    pauseOnInput
    on:Backspace={() => {
      if (searchTerm.length > 0) {
        searchTerm = searchTerm.slice(0, -1);
      }
    }}
    on:Delete={() => {
      searchTerm = "";
    }}
    on:Escape={() => {
      searchTerm = "";
    }}
    on:key={(e) => {
      if (e.detail.length == 1) searchTerm = searchTerm + e.detail;
    }}
  />
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
  </label>
  <span>
    {searchTerm}
    showing items {visible}
    of {bookmarkListSize}, last {searchTerm.length || 1} week{searchTerm.length >
    1
      ? "s"
      : ""}
  </span>
</filterBar>
<anchores bind:clientHeight={hh} bind:clientWidth={ww} class:titleVisible>
  <!-- {#each $filteredListSliced as hostItem (hostItem)} -->
  <!-- {#each hostItems as hostItem (hostItem)} -->
  <!-- <HostItem {hostItem} /> -->
  <!-- {/each} -->
  <VirtualScroll let:data data={$filteredListSliced} key="key" pageMode={true}
  topThreshold={5}
  bottomThreshold={5}
  >
   
    <div class="itemWrapper">
      <HostItems {...data} /></div>
   
  </VirtualScroll>
  <!-- <InfiniteScroll window={true} threshold={1000} on:loadMore={() => page++} /> -->
  {#if loader}<loader><div class="lds-circle"><div /></div></loader>{/if}
</anchores>

<!-- <autoloader bind:this={autoloader}>{hh}</autoloader> -->
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
    display: block;
    /*  */
    position: relative;
    width: 96%;
    padding: 2%;
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
  anchores .itemWrapper {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: flex-end;
    align-items: center;
    width: 100%;
    min-height: 70px;
    justify-content: center;
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
    /* border-radius: 50%; */
    /* background: #fff; */
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
