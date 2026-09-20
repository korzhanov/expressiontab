<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import firstbg from "../assets/expression-drops-xfactorial-com-copyright.jpg";
  import Anchores from "../lib/Anchores.svelte";
  import Timer from "../lib/Timer.svelte";
  import { bgOpacityFromScroll } from "../lib/utils";
  import {
    createBackgroundStore,
    loadBackgroundUrl,
    saveBackgroundUrl,
  } from "../lib/background-persist";
  import {
    fileToBackgroundDataUrl,
    openUrlForSource,
    parseImageDrop,
    type DropImageSource,
  } from "../lib/image-drop";

  let windowHeight = 600;
  let bgOpacity = 1;
  let rafId = 0;
  let lastOpacity = 1;
  /** Подсветка зоны drop */
  let dropActive = false;
  /** Ожидает выбора Open / Set background */
  let pendingDrop: DropImageSource | null = null;
  let dropBusy = false;
  let dropError = "";

  // Не persist(localStorage) — data URL фона не влезает в ~5MB квоту
  const background = createBackgroundStore(firstbg);

  onMount(() => {
    void loadBackgroundUrl(firstbg).then((url) => background.set(url));
  });

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

  function onDragOver(e: DragEvent) {
    // Нужен preventDefault — иначе drop не сработает
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dropActive = true;
  }

  function onDragLeave(e: DragEvent) {
    // Уход за пределы main
    const t = e.relatedTarget as Node | null;
    if (t && (e.currentTarget as Node).contains(t)) return;
    dropActive = false;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dropActive = false;
    dropError = "";
    const src = parseImageDrop(e.dataTransfer);
    if (!src) {
      dropError = "Drop an image file or image URL";
      return;
    }
    pendingDrop = src;
  }

  function cancelDrop() {
    pendingDrop = null;
    dropError = "";
    dropBusy = false;
  }

  function openDropped() {
    if (!pendingDrop) return;
    const url = openUrlForSource(pendingDrop);
    window.open(url, "_blank", "noopener,noreferrer");
    cancelDrop();
  }

  async function setAsBackground() {
    if (!pendingDrop || dropBusy) return;
    dropBusy = true;
    dropError = "";
    try {
      let dataUrl: string;
      if (pendingDrop.kind === "url") {
        // Внешний / data URL — как есть (маленький https ок)
        dataUrl = pendingDrop.url;
      } else {
        // Сжать file → JPEG; крупные — chrome.storage.local
        dataUrl = await fileToBackgroundDataUrl(pendingDrop.file);
      }
      await saveBackgroundUrl(dataUrl);
      background.set(dataUrl);
      cancelDrop();
    } catch (err) {
      console.error(err);
      dropError =
        err instanceof Error && /large|full|storage/i.test(err.message)
          ? "Image too large — try a smaller file"
          : "Could not set background";
      dropBusy = false;
    }
  }
</script>

<svelte:window bind:innerHeight={windowHeight} on:scroll={onScroll} />
<main
  class:dropActive
  in:fade={{ duration: 1000 }}
  out:fade={{ duration: 1000 }}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
>
  <bg
    in:fade
    out:fade
    style="background-image: url('{$background}'); opacity: {bgOpacity};"
  ></bg>
  <spacer>
    <Timer />
  </spacer>

  <Anchores />

  {#if dropActive}
    <div class="dropHint" aria-hidden="true">Drop image — open or set background</div>
  {/if}

  {#if pendingDrop || dropError}
    <div
      class="dropModal"
      role="dialog"
      aria-modal="true"
      aria-label="Image drop"
      tabindex="-1"
      on:click|self={cancelDrop}
      on:keydown={(e) => e.key === "Escape" && cancelDrop()}
    >
      <div class="dropCard">
        <p class="dropTitle">Image dropped</p>
        {#if dropError}
          <p class="dropErr">{dropError}</p>
        {/if}
        {#if pendingDrop}
          <p class="dropSub">Open in a new window, or use as new-tab background?</p>
          <div class="dropActions">
            <button type="button" class="dropBtn" on:click={openDropped}>
              Open in new window
            </button>
            <button
              type="button"
              class="dropBtn primary"
              disabled={dropBusy}
              on:click={setAsBackground}
            >
              {dropBusy ? "Saving…" : "Set as background"}
            </button>
            <button type="button" class="dropBtn ghost" on:click={cancelDrop}>
              Cancel
            </button>
          </div>
        {:else}
          <button type="button" class="dropBtn" on:click={cancelDrop}>OK</button>
        {/if}
      </div>
    </div>
  {/if}
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
  main.dropActive {
    outline: 2px dashed rgba(255, 255, 255, 0.35);
    outline-offset: -8px;
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
    /* без transition на opacity — иначе фон «догоняет» скролл и интерфейс дёргается */
    will-change: opacity;
    pointer-events: none;
  }

  .dropHint {
    position: fixed;
    left: 50%;
    top: 24%;
    transform: translateX(-50%);
    z-index: 200000;
    pointer-events: none;
    padding: 10px 16px;
    border-radius: 8px;
    background: rgba(20, 20, 20, 0.85);
    color: #eee;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .dropModal {
    position: fixed;
    inset: 0;
    z-index: 200001;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
  }
  .dropCard {
    background: rgb(28, 28, 32);
    color: #eee;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    padding: 20px 22px;
    max-width: 360px;
    width: calc(100% - 32px);
    text-align: left;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }
  .dropTitle {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
  }
  .dropSub {
    margin: 0 0 16px;
    font-size: 13px;
    color: #bbb;
    line-height: 1.4;
  }
  .dropErr {
    margin: 0 0 12px;
    font-size: 13px;
    color: #f0a0a0;
  }
  .dropActions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dropBtn {
    background: rgba(255, 255, 255, 0.06);
    color: #ddd;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  .dropBtn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  .dropBtn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .dropBtn.primary {
    background: rgba(57, 94, 157, 0.45);
    border-color: rgba(120, 160, 220, 0.45);
  }
  .dropBtn.ghost {
    background: transparent;
  }
</style>
