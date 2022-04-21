<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import {
    persist,
    indexedDBStorage,
    localStorage,
  } from "@macfja/svelte-persistent-store";
  // import { slimscroll } from "svelte-slimscroll";
  import { fade } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { writable } from "svelte/store";
  import firstbg from "../assets/expression-drops-xfactorial-com-copyright.jpg";
  import Anchores from "../lib/Anchores.svelte";
  import Timer from "../lib/Timer.svelte";
  import {toDataURL} from "../lib/utils";
  let m = { x: 0, y: 0 };
  let scrollY = 0;
  let windowHeight = 0;

  const circleTransitiom = tweened(0, {
    duration: 700,
    easing: cubicOut,
  });
  circleTransitiom.set(10);

  let imgsrc: string =
    "https://source.unsplash.com/random/1920x1080/?mountains,water,cloud,night";
  let background = persist(writable(firstbg), localStorage(), "background");
  let bg = $background;
 
  setTimeout(async () => {
      // console.log("RESULT:", dataUrl);
      tick();
      $background = await toDataURL(imgsrc);
  }, 120000);

  let ready = false;
  onMount(() => (ready = true));
  onDestroy(() => (ready = false));
</script>

<!-- {#if ready} -->
<svelte:window bind:innerHeight={windowHeight} bind:scrollY />
<main in:fade={{ duration: 1000 }} out:fade={{ duration: 1000 }}>
  <bg
    in:fade
    out:fade
    style="background-image: url('{$background}');"
    style:opacity={Math.abs((windowHeight - Math.min(scrollY,windowHeight)))/100}
  />
  <!-- <overlay in:fade out:fade /> -->
  <spacer>
    <Timer />
    <!-- <Counter /> -->
  </spacer>

  <Anchores />
</main>

<!-- {/if} -->
<style lang="scss">
  * {
    --brand-color: rgba(255, 255, 255, 1);
  }
  :root {
    font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  /* custom scrollbar */

  /* end custom scrollbar */
  main {
    text-align: center;
    margin: 0 auto;
    min-height: 100vh;
    transition: all 0.5s ease;
    font-weight: 300;
  }

  spacer {
    background: linear-gradient(
      180deg,
      rgba(20, 20, 20, 0),
      rgba(20, 20, 20, 1)
    );
    height: 92vh;
    transition: height 0.3s ease-in-out 1s;
    display: flex;
    width: 100%;
    position: relative;
    flex-direction: row;
    flex-wrap: nowrap;
    align-content: space-around;
    justify-content: space-around;
    align-items: center;
  }

  bg {
    background-color: #222;
    /* background-image: url("../assets/expression-drops-xfactorial-com-copyright.jpg"); */
    /*, url("https://source.unsplash.com/random/1600x900/?mountains,water,cloud,night"); */
    /* ,expression,city */
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    min-height: 100vh;
    z-index: -2;
    transition: all 0.3s ease;
  }

  overlay {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    overflow: hidden;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.25) 0,
      rgba(0, 0, 0, 0.25)
    );
    z-index: -1;
  }
 
</style>
