<script lang="ts">
  import Icon, { Star, Trash, Duplicate } from "svelte-hero-icons";
  import globe from "../assets/Globe.svg";
  import { fly } from "svelte/transition";
  import { favicons } from "./stores";

  export let index: number = 0;
  export let anchor: any = {};
  export let unfold: boolean | null = null;
  export let childrenInvisible: boolean | null = true;
  export let titleVisible: boolean = false;

  $: id = anchor?.id || 0;
  $: isBookmark = anchor?.isBookmark || false;
  $: title = anchor?.title || "";
  $: url = anchor?.url || "";
  $: visitCount = anchor?.visitCount || 1;
  $: hostVisitCount = anchor?.hostVisitCount || 0;
  $: host = anchor?.host || "localhost";
  $: weightVisits = Math.log10(
    Math.max(unfold ? visitCount : hostVisitCount, visitCount) * 1 || 1
  );
  $: weightVisitsRadius = anchor?.weightVisitsRadius || 50;

  let multiButton = false;
  let menuFlip = false;
  let deleted = false;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let anchorEl: HTMLElement;

  $: src =
    $favicons.get(host) ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("favicon_" + host)
      : null) ||
    anchor?.img_data ||
    globe;

  function openMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      menuFlip = rect.left < 120;
    }
    multiButton = true;
  }

  function scheduleCloseMenu() {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      multiButton = false;
    }, 280);
  }

  function keepMenuOpen() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    multiButton = true;
  }

  async function copyToBuffer(e: Event, copyText: string) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(copyText);
    } catch (err) {
      console.error(err);
    }
  }

  async function changeBookmark() {
    if (isBookmark) {
      chrome.bookmarks.remove(String(id));
      isBookmark = false;
    } else {
      chrome.bookmarks.create({
        url: url,
        title: title,
      });
      isBookmark = true;
    }
  }

  async function deleteAnchore() {
    if (isBookmark) {
      chrome.bookmarks.remove(String(id));
      isBookmark = false;
    }
    try {
      chrome.history.deleteUrl({ url: url });
      deleted = true;
    } catch (e) {
      console.log(e);
    }
  }
</script>

{#if !deleted && anchor}
  <anchor
    bind:this={anchorEl}
    {title}
    style:margin={titleVisible ? "4px 0" : `${weightVisits * 10 + 10}px`}
    class:isBookmark
    class:invisible={!childrenInvisible}
    class:titleVisible
    class:menuFlip
    on:contextmenu={openMenu}
    on:mouseleave={scheduleCloseMenu}
    on:mouseenter={keepMenuOpen}
  >
    {#if !titleVisible}
      <bgcircle
        style="
    transform: translateZ(0) scale({(weightVisits * 1 + 1).toFixed(2)});
    background-image: url('{src}');
"
      />
    {/if}
    <slot />
    <a href={url}>
      <anchoricon style:background-image="url('{src}')" />
      {#if unfold === false && !titleVisible}
        <anchoricon
          class="subicon"
          in:fly={{ x: 95, duration: 300 }}
          out:fly={{ x: 70, duration: 350 }}
          style:background-image="url('{src}')"
        />
        <anchoricon
          class="subicon"
          in:fly={{ x: 55, duration: 300 }}
          out:fly={{ x: 50, duration: 350 }}
          style:background-image="url('{src}')"
          style="transform:  translateZ(0) scale(0.56) translate(51px, -18px);"
        />
      {/if}

      <span class:showTitle={titleVisible}>
        <strong>{title || host}</strong>
        | {isBookmark ? "bookmark" : visitCount + " visits"}
      </span>
    </a>
    {#if multiButton}
      <div
        class="multiButton"
        class:menuFlip
        on:mouseenter={keepMenuOpen}
        on:mouseleave={scheduleCloseMenu}
      >
        <button
          class:isBookmark
          title="Bookmark"
          on:click={() => changeBookmark()}
        >
          <Icon src={Star} solid size="22" />
        </button>
        <button
          class="copyToBuffer"
          title="Copy url"
          on:click={(e) => copyToBuffer(e, url)}
        >
          <Icon src={Duplicate} solid size="22" />
        </button>
        <button title="Delete" on:click={() => deleteAnchore()}>
          <Icon src={Trash} solid size="22" />
        </button>
      </div>
    {/if}
  </anchor>
{/if}

<style lang="scss">
  .invisible {
    display: none;
  }

  anchoricon {
    height: 18px;
    width: 18px;
    margin: 6px;
    transform: translateZ(0) scale(1.2);
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 2px;
    background-image: url("../assets/Globe.svg");
    background-size: contain;
    box-sizing: border-box;
    filter: drop-shadow(3px 1px 4px rgba(20, 20, 20, 0.52));
  }
  anchoricon.subicon {
    position: absolute;
    z-index: -1;
    opacity: 0.2;
    transform: translateZ(0) scale(0.9) translate(16px, -8px);
    border-radius: 4px;
  }

  anchor {
    --background: #fff;
    --text: black;
    position: relative;
    width: 50px;
    height: 50px;
    border-radius: 50px;
    margin: 2px;
    border: 10px solid transparent;
    text-overflow: ellipsis;
    display: block;
    padding-right: 0px;
    box-sizing: border-box;
    transition: transform 0.3s ease, border-color 0.3s ease;
  }
  anchor.titleVisible {
    width: 100%;
    height: auto;
    min-height: 36px;
    border-radius: 8px;
    border-width: 2px;
    margin: 4px 0;
    padding: 4px 8px;
  }
  anchor bgcircle {
    width: 30px;
    height: 30px;
    background-color: rgba(31, 30, 30, 0.65);
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    border-radius: 50px;
    position: absolute;
    left: 0;
    top: 0;
    z-index: -1;
    filter: brightness(1) contrast(1) saturate(1.3);
    transform: translateZ(0);
    box-shadow: 5px 5px 10px #222;
  }
  anchor:hover bgcircle {
    will-change: transform, opacity;
  }
  anchor.isBookmark {
    background-color: #484848;
    border-width: 7px !important;
    border-color: #353535;
    border-style: solid;
    padding: 3px;
  }
  .multiButton {
    z-index: 1000;
    position: absolute;
    top: 1.25rem;
    left: 1.25rem;
    border-radius: 100%;
    width: 10rem;
    height: 10rem;
    opacity: 1;
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }
  .multiButton.menuFlip {
    left: auto;
    right: 1.25rem;
    transform: translate(50%, -50%);
  }
  .multiButton button {
    display: grid;
    place-items: center;
    position: absolute;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 100%;
    background: var(--background);
    color: var(--text);
    transform: translateZ(0) translate(-50%, -50%);
    cursor: pointer;
    transition: left 0.2s ease, top 0.2s ease;
    box-shadow: 0 0 0rem -0.25rem var(--background);
    &:hover {
      background: var(--text);
      color: var(--background);
      box-shadow: 0 0 1rem -0.25rem var(--background);
      z-index: 1000;
    }
    &:first-child:nth-last-child(3),
    &:first-child:nth-last-child(3) ~ * {
      &:nth-child(1) {
        left: 50%;
        top: 15.625%;
      }
      &:nth-child(2) {
        left: 25%;
        top: 25%;
      }
      &:nth-child(3) {
        left: 15.625%;
        top: 50%;
      }
    }
  }
  .multiButton.menuFlip button {
    &:first-child:nth-last-child(3),
    &:first-child:nth-last-child(3) ~ * {
      &:nth-child(1) {
        left: 50%;
        top: 15.625%;
      }
      &:nth-child(2) {
        left: 75%;
        top: 25%;
      }
      &:nth-child(3) {
        left: 84.375%;
        top: 50%;
      }
    }
  }
  anchor a {
    color: #ddd;
    text-decoration: none;
    font-size: 13px;
    line-height: 20px;
    height: 30px;
    width: 30px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    align-content: flex-end;
  }
  anchor.titleVisible a {
    width: 100%;
    height: auto;
    min-height: 28px;
  }
  anchor a span {
    display: block;
    width: 0px;
    overflow: hidden;
    opacity: 0;
  }
  anchor a span.showTitle {
    display: block;
    min-width: 100px;
    width: auto;
    flex: 1;
    opacity: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    margin-left: 8px;
  }
</style>
