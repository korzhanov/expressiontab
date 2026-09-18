<script lang="ts">
  import { persist, localStorage } from "@macfja/svelte-persistent-store";
  import { fade } from "svelte/transition";
  import { writable } from "svelte/store";
  import firstbg from "../assets/expression-drops-xfactorial-com-copyright.jpg";
  import Anchores from "../lib/Anchores.svelte";
  import Timer from "../lib/Timer.svelte";
  import { bgOpacityFromScroll } from "../lib/utils";

  let windowHeight = 600;
  let bgOpacity = 1;
  let rafId = 0;
  let lastOpacity = 1;

  let background = persist(writable(firstbg), localStorage(), "background");

  // Пассивный scroll без bind:scrollY — меньше реактивных проходов Svelte на кадр
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      const next = bgOpacityFromScroll(y, windowHeight);
      // Обновляем DOM только при заметном изменении — без transition-борьбы
      if (Math.abs(next - lastOpacity) > 0.02) {
        lastOpacity = next;
        bgOpacity = next;
      }
      rafId = 0;
    });
  }
</script>

<svelte:window bind:innerHeight={windowHeight} on:scroll={onScroll} />
<main in:fade={{ duration: 1000 }} out:fade={{ duration: 1000 }}>
  <bg
    in:fade
    out:fade
    style="background-image: url('{$background}'); opacity: {bgOpacity};"
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
  }

  spacer {
    background: linear-gradient(
      180deg,
      rgba(20, 20, 20, 0),
      rgba(20, 20, 20, 1)
    );
    height: 92vh;
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
    /* Обесцвечиваем фото — dial и filter bar читаются лучше */
    filter: grayscale(1) saturate(0);
    /* без transition на opacity — иначе фон «догоняет» скролл и интерфейс дёргается */
    will-change: opacity;
    pointer-events: none;
  }
</style>
