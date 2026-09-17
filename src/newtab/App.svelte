<script lang="ts">
  import { persist, localStorage } from "@macfja/svelte-persistent-store";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  import firstbg from "../assets/expression-drops-xfactorial-com-copyright.jpg";
  import Anchores from "../lib/Anchores.svelte";
  import Timer from "../lib/Timer.svelte";
  import { bgOpacityFromScroll } from "../lib/utils";

  let scrollY = 0;
  let windowHeight = 600;
  let bgOpacity = 1;
  let rafId = 0;

  let background = persist(writable(firstbg), localStorage(), "background");

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      bgOpacity = bgOpacityFromScroll(scrollY, windowHeight);
      rafId = 0;
    });
  }

  $: if (windowHeight) {
    bgOpacity = bgOpacityFromScroll(scrollY, windowHeight);
  }
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  bind:scrollY
  on:scroll={onScroll}
/>
<main in:fade={{ duration: 1000 }} out:fade={{ duration: 1000 }}>
  <bg
    in:fade
    out:fade
    style="background-image: url('{$background}');"
    style:opacity={bgOpacity}
  />
  <spacer>
    <Timer />
  </spacer>

  <Anchores />
</main>

<style lang="scss">
  * {
    --brand-color: rgba(255, 255, 255, 1);
  }
  :root {
    font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    margin: 0 auto;
    left: 0;
    top: 0;
    min-height: 100vh;
    transition: width, opacity 0.3s ease;
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
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    min-height: 100vh;
    z-index: -2;
    transition: opacity 0.15s ease;
  }
</style>
