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
  import { filteredListSliced } from "./stores";
  import { toDataURL, ignoreUrl } from "./utils";

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

  async function getBookmarks() {
    //
    console.log("get bookmark searchTerm",searchTerm);
    loader = true;
    // @todo фильтровать по имеющимся анкорам
    // @todo догружать по мере поиска по истории
    const promise = Promise.all([
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
      chrome.bookmarks.search(searchTerm || "http"), // получаем массив закладок по запросу или по всем ссылкообразным закладкам если нет запроса
    ]);
    const s = await promise; // получаем массив из двух объектов
    let a: any = s[0]; // первый объект истории
    let b: any = s[1]; // второй объект закладок
    let arr1Length = a.length; // длина массива истории
    let arr2Length = b.length; // длина массива закладок
    // a.length = arr1Length + arr2Length;
    // // записываем массив закладок b в конец массива истории a
    // for (let i = 0; i < arr2Length; i++) {
    //   a[arr1Length + i] = b[i];
    //   a[arr1Length + i].isBookmark = true; // добавляем поле обозначающее что это закладка
    // }
    // // b = []; // очищаем массив закладок
    // arr1Length = a.length; // получаем длину массива после добавления анкоров
    bookmarkList = new Map(); // очищаем карту анкоров
    let maxVisits: number = 1; // максимальное количество посещений
    // оптимизировать проход по массивам, совместить вычисления в один проход по длине массива
    for (let i = 0; i < arr1Length + arr2Length; i++) {
      // перебираем массив истории и закладок

      let c: any;
      if (i >= arr1Length) {
        // если перебираем закладки
        c = b[i - arr1Length]; // получаем элемент закладки
        c.isBookmark = true; // добавляем поле обозначающее что это закладка
      } else c = a[i]; // получаем элемент истории
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
        c.img_data = online
          ? // ? "https://s2.googleusercontent.com/s2/favicons?domain_url=" + encodeURIComponent(c.url)
            "https://favicon.yandex.net/favicon/" + host
          : localStorage.getItem("favicon_" + host);
        if (bookmarkList.has(host)) {
          // если хост уже есть в карте
          let bmitems = bookmarkList.get(host); // получаем массив анкоров для хоста
          bmitems[0].hostVisitCount =
            bmitems[0].hostVisitCount * 1 + (c.visitCount || 1); // увеличиваем количество посещений хоста
          maxVisits = Math.max(maxVisits, bmitems[0].hostVisitCount); // получаем максимальное количество посещений
          c.weightVisits = Math.log10(Math.max(c.visitCount||1,c.hostVisitCount||1)); // получаем вес посещений
          c.weightVisitsRadius = c.weightVisits * 10 + 10 + 50; // получаем примерный радиус анкора в зависимисти от веса посещений
          bmitems[0].weightVisits = bmitems[0].weightVisits * 1 + c.weightVisits; // увеличиваем вес посещений хоста
          bmitems[0].weightVisitsRadius = bmitems[0].weightVisits * 10 + 10 + 50; // увеличиваем вес посещений хоста
          // console.log("bmitems[0].weightVisits",bmitems[0].weightVisits);

          bmitems.push(c); // добавляем в массив анкоров для хоста
          bookmarkList.set(host, bmitems); // добавляем в карту анкоров
          // bookmarkList.set(host, [...bmitems, c]); // добавляем в карту анкоров
        } else {
          // если хоста нет в карте
          // console.log("c",c);
          c.hostVisitCount = c.visitCount || 1; // присваиваем количество посещений
          c.weightVisits = Math.log10(c.hostVisitCount); // получаем вес посещений
          // console.log("c.weightVisits",c.weightVisits);
          
          c.weightVisitsRadius = c.weightVisits * 10 + 10 + 50; // получаем примерный радиус анкора в зависимисти от веса посещений
          bookmarkList.set(host, [c]); // добавляем в карту анкоров
        }
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
    // loadmore(true); // отправляем в рендер данные о карте анкоров
  }

  // разбиваем на чанки

  async function makechanks() {
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
    localStorage.searchTerm = searchTerm; // сохраняем поисковый запрос в локальное хранилище
    filteredListSliced.set([]);
    clearTimeout(timer); // очищаем таймер
    timer = setTimeout(() => {
      // запускаем таймер
      getBookmarks(); // запускаем загрузку анкоров
    }, 1050); // задержка в мс перед загрузкой анкоров
  }

  async function loadmore(force: boolean = false) {
    // загружаем закладки
    // let pixel_offset: number = 500;
    // console.log(
    //   "windowY + window.innerHeight, document.body.scrollHeight - pixel_offset"
    // );
    // console.log(
    //   windowY + window.innerHeight,
    //   document.body.scrollHeight - pixel_offset
    // );
    // if (
    //   force || // если принудительно загружаем
    //   // если приближаемся к концу страницы
    //   (windowHeight + windowY >=
    //     document.documentElement.scrollHeight - pixel_offset && // или приближаемся к концу страницы
    //   bookmarkListSize > 0 && // если есть карта анкоров
    //     visible != bookmarkList.size)
    // ) {
    //   // если карта анкоров изменилась
    //   console.log("loadmore render"); // выводим сообщение о загрузке закладок
    //   loader = true;
    //   // показывать закладки по мере прокрутки до конца страницы
    //   // let bookmarkListArray = Array.from(bookmarkList.values()); // получаем массив анкоров из карты анкоров
    //   // let nowvisible = Math.ceil((hh * ww) / 50 / 50); // получаем примерное количество видимых анкоров
    //   // console.log("nowvisible", nowvisible);
    //   let start = visible; // начальное значение видимых анкоров
    //   let end = Math.min(visible + 400, bookmarkListSize); // конечное значение видимых анкоров
    //   visible = end; // присваиваем количество видимых анкоров
    //   console.log("visible", visible);
    //   console.log("start, end", start, end);
    //   try {
    //     const startTime = performance.now();
    //     // await tick();
    //     if (visible) {
    //       // filteredListSliced.set(Array.from(bookmarkList).slice(0, end)); // получаем массив анкоров из карты анкоров
    //       // filteredListSliced.set(Array.from(bookmarkList).slice(0, end)); // получаем массив анкоров из карты анкоров
    //       filteredListSliced.set(Array.from(bookmarkList)); // получаем массив анкоров из карты анкоров
    //     } else filteredListSliced.set([]);
    //     // let incrementVisible = 100;
    //     // visible = Math.abs(
    //     //   Math.min(nowvisible + incrementVisible, bookmarkList.size)
    //     // );
    //     // filteredListSliced = Array.from(bookmarkList).slice(0, visible);
    //     // await tick();
    //     const duration = performance.now() - startTime;
    //     console.log(`filteredListSliced.set took ${duration}ms`);
    //   } catch (e) {
    //     console.log("error of render");
    //     console.log(e);
    //   }
    //   loader = false;
    //   scrolling = false;
    // }
  }

  $: if (titleVisible) {
    visible = 200;
  } else {
    visible = 300;
  }

  onMount(() => {
    // loadmore(true);
  });

  onDestroy(() => {
    // localStorage.setItem("maxVisits", "0");
  });

  // let hostItems: Array<any> = [];

  // $: hostItems = [
  //   ...hostItems,
  //   ...$filteredListSliced.splice(size * page, size * (page + 1) - 1),
  // ];
</script>

<!-- 
  on:scroll={() => onScroll()}
  on:keyup={handleKeyup}-->
<svelte:window
  bind:scrollY={windowY}
  bind:innerHeight={windowHeight}
  bind:innerWidth={windowWidth}
/>
<!-- <p>showing items {start}-{end}:{visible}</p> -->
<!-- <filterBar class="text-white">
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
</filterBar> -->
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
    /* display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: flex-end;
    align-items: center; */
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
