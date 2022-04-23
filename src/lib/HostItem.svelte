<script lang="ts">
  import { setContext, getContext, hasContext, tick } from "svelte";
  import { children } from "svelte/internal";
  import { fly, scale, slide } from "svelte/transition";

  import AnchoreItem from "./AnchoreItem.svelte";
  import { longhover } from "./longhover";
  import { toDataURL } from "./utils";
  export let hostItem: any;
  let anchores = hostItem || [];
  let hostAnchore = anchores[0] || [];
//   let domain = new URL(anchores[0].url).host.split(":")[0]  ;
  let otherAnchores = anchores[1]?anchores.slice(1):[];
  let tweenOtherAnchores: Array<any> = [];
  let unfold = false;
  let childrenInvisible = false;

  let favicon_localhost = localStorage.favicon_localhost;

  async function tweenAnchores() {
    unfold = !unfold;
    childrenInvisible = !childrenInvisible;
    // if (unfold == true) { // если выпадает
    //   let minLenght: number = otherAnchores.length; // минимальная длина массива
    //   if (otherAnchores.length > 50) { // если больше 50 элементов
    //     minLenght = Math.min(Math.floor(otherAnchores.length / 2), 50); // минимальная длина массива
    //   }
    //   for (let i = 0; i < minLenght; i++) { // проходим по массиву и добавляем в массив твинов
    //     let newItem = otherAnchores[i];
    //     // setTimeout(async function() {
    //       tweenOtherAnchores[i] = newItem;
    //     // }, 150);
    //     // tweenOtherAnchores[i] = newItem;
    //   }
    //   if (otherAnchores.length > 50) { // если больше 50 элементов
    //     setTimeout(async function() {
    //       await tick();
    //       tweenOtherAnchores = otherAnchores;
    //     }, 350);
    //   }
    //   console.log("minLengh = " + minLenght);
    // } else {
    //   console.log("unfold ", unfold);
    //   tweenOtherAnchores = tweenOtherAnchores.slice(
    //     0,
    //     Math.min(Math.floor(tweenOtherAnchores.length / 3), 100)
    //   );
    //   for (let j = 0; j < tweenOtherAnchores.length; j++) {
    //     setTimeout(async function(j: number) {
    //       tweenOtherAnchores.pop();
    //       // tweenOtherAnchores.slice(
    //       //    tweenOtherAnchores.length - 2, 1
    //       // );
    //       tweenOtherAnchores = tweenOtherAnchores;
    //     }, 300);
    //   }
    // }
    hostAnchore = hostAnchore;
  }

  // let maxVisits = hostAnchore.hostVisitCount;
  // if (hasContext('maxVisits')) {
  // 	maxVisits = Math.max(getContext('maxVisits'), maxVisits);
  // }
  // setContext('maxVisits', maxVisits);
  let host: string = "localhost";
  try {
    host = new URL(hostAnchore.url).host.split(":")[0];
    setTimeout(async () => {
      let fav = localStorage.getItem("favicon_" + host);
      if (!fav?.length) {
        // if (!favicon_localhost || favicon_localhost?.lenth==0) {
        //   favicon_localhost = await toDataURL(
        //     "https://s2.googleusercontent.com/s2/favicons?domain_url=http://localhost"
        //   );
        //   localStorage.setItem("favicon_localhost", favicon_localhost);
        // }
        const promises = Promise.all([
            toDataURL("http://www.google.com/s2/favicons?domain=" + host),
            toDataURL("https://favicon.yandex.net/favicon/" + host),
        //   toDataURL("chrome://favicon2/?size=16&scale_factor=1x&page_url=" +encodeURIComponent(hostAnchore.url)),
          toDataURL(
            "https://s2.googleusercontent.com/s2/favicons?domain_url=" +
              hostAnchore.url
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
    console.log("No favicon for url: ", hostAnchore, e);
  }

</script>

{#if hostItem}
  {#if anchores.length < 3}
    {#each anchores as item (item)}
      <AnchoreItem anchor={item} {host} childrenInvisible=false />
    {/each}
  {:else}
    <anchorGroup
      class="hovicon effect-8"
      use:longhover={3000}
      on:longhover|stopPropagation|preventDefault={tweenAnchores}
      on:contextmenu={() => (unfold = true)}
      class:unfold
      title={otherAnchores.length}
    >
      <AnchoreItem anchor={hostAnchore} {host} {unfold} childrenInvisible={true}/>
    </anchorGroup>
    {#each otherAnchores as item (item)}
      <AnchoreItem anchor={item} {host} {childrenInvisible}/>
    {/each}
  {/if}
{/if}

<style lang="scss">
  anchorGroup {
    width: 50px;
    height: 50px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    align-items: baseline;
    flex-direction: row;
    width: 50px;
    height: 50px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    align-items: baseline;
    flex-direction: row;
    border: 20px solid #1b1b1bcf !important;
    filter: saturate(1.12);
    background-color: #6c519433;
    border-radius: 50%;
    margin: 30px;
    transition: all 1s ease;
  }
  anchorGroup:hover {
    transition: all 1s ease;
    /* // border: 1px dashed rgb(58, 42, 42) !important; */
    border: 20px solid #1d1d1df2 !important;
  }

  .hovicon {
    cursor: pointer;
  }
  .hovicon:after {
    pointer-events: none;
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    content: "";
    -webkit-box-sizing: content-box;
    -moz-box-sizing: content-box;
    box-sizing: content-box;
  }
  .hovicon:before {
    display: block;
    -webkit-font-smoothing: antialiased;
  }
  /* Effect 8 */
  .hovicon.effect-8 {
    transition: transform ease-out 0.1s, background;
    transition: all ease-out 0.7s;
  }
  .hovicon.effect-8:after {
    top: 0;
    left: 0;
    z-index: -1;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    opacity: 0;
    transform: scale(0.9);
  }
  .hovicon.effect-8:hover {
    transform: scale(0.93);
    background-color: #ffffffcf;
    transform: scale(0.93);
    background-color: #ffffffcf;
    transition: all 0.3;
  }
  .hovicon.effect-8:hover:after {
    animation: sonarEffect 2.77s cubic-bezier(0, 1.86, 0.93, -0.89) 0.33s;
    animation-iteration-count: 3;
  }
  .unfold.hovicon.effect-8:hover:after {
    animation: sonarEffect 0.8s ease-in 1s reverse;
    animation-iteration-count: 3;
  }
  @keyframes sonarEffect {
    0% {
      opacity: 0.3;
    }
    40% {
      opacity: 0.5;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 10px 10px #adadad,
        0 0 0 10px rgba(255, 255, 255, 0.5);
    }
    100% {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 10px 10px #adadad,
        0 0 0 10px rgba(255, 255, 255, 0.5);
      transform: scale(3);
      opacity: 0;
    }
  }
</style>
