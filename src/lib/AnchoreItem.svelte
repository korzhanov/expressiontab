<script lang="ts">
  import Icon, { Star, Trash, Duplicate } from "svelte-hero-icons";
  import globe from "../assets/Globe.svg";
  import { fly, fade } from "svelte/transition";
  import { onDestroy, onMount } from "svelte";
  import { favicons } from "./stores";
  import * as Tooltip from "./components/ui/tooltip";
  import BubblePop from "./BubblePop.svelte";

  export let anchor: any = {};
  export let unfold: boolean | null = null;
  export let childrenInvisible: boolean | null = true;
  export let titleVisible: boolean = false;
  /** Вложенная ссылка группы в lined — отступ слева */
  export let nested: boolean = false;

  $: id = anchor?.id || 0;
  $: isBookmark = anchor?.isBookmark || false;
  $: title = anchor?.title || "";
  $: url = anchor?.url || "";
  $: visitCount = anchor?.visitCount || 1;
  $: hostVisitCount = anchor?.hostVisitCount || 0;
  $: host = anchor?.host || "localhost";
  // В lined кнопки чуть меньше ряда; в bubble — крупнее
  $: actionIconSize = titleVisible ? "16" : "22";
  $: weightVisits = Math.log10(
    Math.max(unfold ? visitCount : hostVisitCount, visitCount) * 1 || 1
  );
  $: weightVisitsRadius = anchor?.weightVisitsRadius || 50;

  let multiButton = false;
  let menuFlip = false;
  let deleted = false;
  /** Идёт анимация лопания перед удалением из DOM */
  let popping = false;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let anchorEl: HTMLElement;

  $: src =
    $favicons.get(host) ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("favicon_" + host)
      : null) ||
    anchor?.img_data ||
    globe;

  function closeMenu() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    multiButton = false;
  }

  /** Показать меню действий (hover / ПКМ); клик по ссылке не блокируем — pointer-events:none на оверлее */
  function showMenu() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      // По умолчанию кнопки справа сверху; у правого края — зеркало влево
      menuFlip =
        typeof window !== "undefined" &&
        rect.right > window.innerWidth - 140;
    }
    multiButton = true;
  }

  function openMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    showMenu();
  }

  function scheduleCloseMenu() {
    if (closeTimer) clearTimeout(closeTimer);
    // Небольшая задержка — успеть доехать курсором до кнопок меню
    closeTimer = setTimeout(() => {
      multiButton = false;
    }, 280);
  }

  /** Курсор на кнопках меню — не закрывать */
  function keepMenuOpen() {
    if (!multiButton) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  async function copyToBuffer(e: Event, copyText: string) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(copyText);
    } catch (err) {
      console.error(err);
    }
  }

  /** Обёртка без type-annot в разметке (Svelte 3 parser) */
  function onCopyClick(e: Event) {
    copyToBuffer(e, url);
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
    if (popping || deleted) return;
    if (isBookmark) {
      chrome.bookmarks.remove(String(id));
      isBookmark = false;
    }
    try {
      chrome.history.deleteUrl({ url: url });
    } catch (e) {
      console.log(e);
    }
    // Сначала лопание пузырька (CodePen-мотив), потом убираем из списка
    popping = true;
    closeMenu();
    setTimeout(() => {
      deleted = true;
      popping = false;
    }, 680);
  }

  onMount(() => {
    // pageMode VirtualScroll: mouseleave при скролле часто не приходит
    const onScroll = () => {
      if (multiButton) closeMenu();
    };
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener("scroll", onScroll, opts);
    return () => window.removeEventListener("scroll", onScroll, opts);
  });

  onDestroy(() => {
    closeMenu();
  });
</script>

{#if !deleted && anchor && url && (url.startsWith("http://") || url.startsWith("https://"))}
  <Tooltip.List
    content={nested ? url : title || host}
    side="bottom"
    delayDuration={450}
    block={titleVisible}
    disabled={titleVisible && !nested}
  >
    <anchor
      bind:this={anchorEl}
      style:margin={titleVisible ? "2px 0" : `${Math.min(weightVisits, 2) * 8 + 8}px`}
      class:isBookmark
      class:invisible={!childrenInvisible}
      class:titleVisible
      class:nested={nested && titleVisible}
      class:menuFlip
      class:popping
      on:contextmenu={openMenu}
      on:mouseleave={scheduleCloseMenu}
      on:mouseenter={showMenu}
    >
      <div class="popLayer" aria-hidden="true">
        <BubblePop active={popping} />
      </div>
      {#if !titleVisible}
        <bgcircle
          style="
    transform: translateZ(0) scale({(Math.min(weightVisits, 2) * 0.35 + 1).toFixed(2)});
    background-image: url('{src}');
"
        />
      {/if}
      <slot />
      <a href={url} rel="noopener noreferrer" on:click|stopPropagation>
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
          class:lined={titleVisible}
          transition:fade={{ duration: 160 }}
          on:mouseenter={keepMenuOpen}
          on:mouseleave={scheduleCloseMenu}
        >
          <Tooltip.List content="Bookmark" side="top" delayDuration={200}>
            <button
              class:isBookmark
              type="button"
              aria-label="Bookmark"
              on:click={() => changeBookmark()}
            >
              <Icon src={Star} solid size={actionIconSize} />
            </button>
          </Tooltip.List>
          <Tooltip.List content="Copy url" side="top" delayDuration={200}>
            <button
              class="copyToBuffer"
              type="button"
              aria-label="Copy url"
              on:click={onCopyClick}
            >
              <Icon src={Duplicate} solid size={actionIconSize} />
            </button>
          </Tooltip.List>
          <Tooltip.List content="Delete" side="top" delayDuration={200}>
            <button
              type="button"
              aria-label="Delete"
              on:click={() => deleteAnchore()}
            >
              <Icon src={Trash} solid size={actionIconSize} />
            </button>
          </Tooltip.List>
        </div>
      {/if}
    </anchor>
  </Tooltip.List>
{/if}

<style lang="scss">
  .invisible {
    display: none;
  }

  anchoricon {
    height: 24px;
    width: 24px;
    margin: 4px 8px 4px 4px;
    transform: translateZ(0) scale(1);
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 4px;
    background-image: url("../assets/Globe.svg");
    background-size: contain;
    box-sizing: border-box;
    filter: drop-shadow(2px 1px 3px rgba(20, 20, 20, 0.45));
    flex-shrink: 0;
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
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
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
    transition: transform 0.35s var(--ease-out), border-color 0.35s var(--ease-out),
      background-color 0.35s var(--ease-out), box-shadow 0.35s var(--ease-out),
      opacity 0.35s var(--ease-out);
  }
  // Во время лопания прячем контент иконки — виден только BubblePop
  anchor.popping {
    pointer-events: none;
    background-color: transparent !important;
    border-color: transparent !important;
  }
  anchor.popping > :not(.popLayer) {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.12s ease;
  }
  .popLayer {
    position: absolute;
    inset: -4px;
    z-index: 3000;
    pointer-events: none;
  }
  anchor.titleVisible {
    width: 100%;
    height: auto;
    min-height: 44px;
    border-radius: 12px;
    border-width: 1px;
    border-color: rgba(255, 255, 255, 0.07);
    margin: 3px 0;
    padding: 10px 14px;
    background-color: rgba(255, 255, 255, 0.035);
  }
  // Вложенные URL группы — визуальная иерархия списка
  anchor.titleVisible.nested {
    background-color: transparent;
    border-color: transparent;
    padding: 7px 12px 7px 8px;
    min-height: 36px;
    border-radius: 8px;
  }
  anchor.titleVisible:hover {
    background-color: rgba(255, 255, 255, 0.075);
    border-color: rgba(255, 255, 255, 0.14);
  }
  anchor.titleVisible.nested:hover {
    background-color: rgba(255, 255, 255, 0.055);
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
    transition: transform 0.45s var(--ease-out), opacity 0.35s var(--ease-out);
  }
  anchor.isBookmark {
    background-color: #484848;
    border-width: 7px !important;
    border-color: #353535;
    border-style: solid;
    padding: 3px;
  }
  anchor.titleVisible.isBookmark {
    border-width: 1px !important;
    border-color: rgba(240, 192, 64, 0.35);
    background-color: rgba(240, 192, 64, 0.06);
    padding: 8px 12px;
  }
  .multiButton {
    z-index: 1000;
    position: absolute;
    // Центр над иконкой — дуга сверху (bubble view)
    top: 0.15rem;
    left: 1.25rem;
    border-radius: 100%;
    width: 6.5rem;
    height: 6.5rem;
    opacity: 1;
    transform: translate(-50%, -50%);
    // Пустая зона не перехватывает клик — открывается <a> под меню
    pointer-events: none;
  }
  .multiButton.menuFlip {
    left: 1.25rem;
    right: auto;
    transform: translate(-50%, -50%);
  }
  // Lined list: кнопки справа в ряд — не перекрывают заголовок и соседей
  .multiButton.lined {
    top: 50%;
    left: auto;
    right: 10px;
    width: auto;
    height: auto;
    border-radius: 0;
    transform: translateY(-50%);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .multiButton.lined.menuFlip {
    right: 10px;
    left: auto;
    transform: translateY(-50%);
  }
  .multiButton button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: static;
    width: 2rem;
    height: 2rem;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 100%;
    background: var(--background);
    color: var(--text);
    line-height: 0;
    // Только кнопки ловят клик (контейнер pointer-events: none)
    pointer-events: auto;
    transform: none;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
      transform 0.28s var(--ease-out);
    box-shadow: 0 0 0rem -0.25rem var(--background);
    z-index: 1001;
    &:hover {
      background: var(--text);
      color: var(--background);
      box-shadow: 0 0 1rem -0.25rem var(--background);
      z-index: 1002;
    }
    // Центр иконки внутри круга (svelte-hero-icons / svg)
    :global(svg) {
      display: block;
      margin: 0;
      flex-shrink: 0;
    }
  }
  // Дуга сверху: позиции на обёртках Tooltip (не на button)
  .multiButton:not(.lined) :global(.tooltip-root) {
    position: absolute;
    pointer-events: auto;
    transform: translate(-50%, -50%);
  }
  .multiButton:not(.lined) :global(.tooltip-root:nth-child(1)) {
    left: 22%;
    top: 28%;
  }
  .multiButton:not(.lined) :global(.tooltip-root:nth-child(2)) {
    left: 50%;
    top: 8%;
  }
  .multiButton:not(.lined) :global(.tooltip-root:nth-child(3)) {
    left: 78%;
    top: 28%;
  }
  .multiButton.lined button {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
  }
  .multiButton.lined :global(.tooltip-root) {
    position: static;
    transform: none;
    pointer-events: auto;
  }
  // Hovered dial выше соседей — кнопки не «под» соседней иконкой
  anchor:hover,
  anchor.menuFlip {
    z-index: 50;
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
    position: relative;
    z-index: 2;
    pointer-events: auto;
    cursor: pointer;
  }
  anchor.titleVisible a {
    width: 100%;
    height: auto;
    min-height: 28px;
    padding-right: 7rem; // место под ряд кнопок справа
    color: rgba(255, 255, 255, 0.9);
    gap: 2px;
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
    margin-left: 10px;
    font-size: 14px;
    line-height: 1.35;
    letter-spacing: 0.01em;
  }
  anchor a span.showTitle strong {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
  }
</style>
