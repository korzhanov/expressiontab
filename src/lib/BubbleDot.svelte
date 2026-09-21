<script lang="ts">
  /**
   * Один пузырёк в BubbleField — позиция из d3-force, spawn CSS.
   * Groupable: inflate 3с → BubblePop → expand.
   * Тултипы — hover (портал). Действия Bookmark/Copy/Delete — только ПКМ на портале.
   */
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import globe from "../assets/Globe.svg";
  import BubbleActions from "./BubbleActions.svelte";
  import BubblePop from "./BubblePop.svelte";
  import * as Tooltip from "./components/ui/tooltip";
  import {
    claimActiveTooltip,
    releaseActiveTooltip,
  } from "./components/ui/tooltip/portal";
  import { longhover, GROUP_LONGHOVER_MS } from "./longhover";
  import { resolveFaviconSrc } from "./bookmarks";
  import {
    COVER_MIN_SIZE,
    resolveCoverSrc,
    resolveTipImageSrc,
  } from "./cover-icons";
  import { ensureIconsForAnchor } from "./icon-ensure";
  import { covers, favicons, tipImages } from "./stores";
  import type { BubbleEnterAnim, BubbleNode } from "./bubble-physics";
  import { buildAnchorTooltip } from "./age-format";

  export let bubble: BubbleNode;
  export let expanded: boolean = false;
  /** Несколько URL на хост — цвет-маркер, expand без «+» */
  export let groupable: boolean = false;
  /** Кадр physics — пересчёт transform без remount */
  export let frame: number = 0;
  /** Тик только при drag этого пузыря (остальные не инвалидируем) */
  export let dragTick: number = 0;
  /** Тик роста радиуса / лопания */
  export let inflateTick: number = 0;
  /** Пузырь сейчас тянут — grab/grabbing + без tooltip delay */
  export let dragging: boolean = false;
  /** Идёт изменение радиуса (unfold / hover-grow) */
  export let inflating: boolean = false;
  /** Активно лопание BubblePop */
  export let popping: boolean = false;
  /** Вход в viewport: initial / rise (скролл вниз) / fall (вверх) */
  export let enterAnim: BubbleEnterAnim = "initial";
  /** Сессия вкладок — другой hue */
  export let session: boolean = false;
  export let onInflateStart: () => void = () => {};
  export let onInflateCancel: () => void = () => {};
  export let onExpandCommit: () => void = () => {};
  export let onExpandRequest: () => void = () => {};
  export let onPointerDown: (e: PointerEvent) => void = () => {};
  export let onLinkClick: (e: MouseEvent) => void = () => {};
  /** Удалить пузырь из dial после pop */
  export let onDelete: () => void = () => {};
  /** Переключить закладку (Star) */
  export let onToggleBookmark: () => void = () => {};

  // frame | dragTick | inflateTick — Svelte видит мутации x/y/r
  $: size =
    frame + dragTick + inflateTick >= 0 ? bubble.r * 2 : bubble.r * 2;
  // initial — staggered spawn; rise/fall — короткий stagger у края;
  // child с spawnIndex 0 (burst из pop) — без задержки, вместе с лопанием
  $: delay =
    enterAnim === "initial"
      ? Math.min(bubble.spawnIndex, 48) * 0.035
      : Math.min((bubble.spawnIndex % 10) * 0.025, 0.18);
  $: tx = (bubble.x || 0) - bubble.r;
  $: ty = (bubble.y || 0) - bubble.r;
  // зависимость от тиков (иначе tx/ty не обновятся при мутации bubble)
  $: if (frame + dragTick + inflateTick >= 0) {
    tx = (bubble.x || 0) - bubble.r;
    ty = (bubble.y || 0) - bubble.r;
  }

  $: host = bubble.host;
  let multiButton = false;
  let localBookmark = !!bubble.isBookmark;
  $: localBookmark = !!bubble.isBookmark;
  // Session host: число вкладок вместо favicon/globe
  $: sessionTabCount =
    session && bubble.kind === "host" && (bubble.tabCount || 0) > 0
      ? bubble.tabCount!
      : 0;
  $: showSessionCount = sessionTabCount > 0;
  // miss → Globe; page → host → globe (Docs/Notion свой favicon)
  $: faviconSrc = resolveFaviconSrc(host, $favicons, globe, bubble.url);
  // Cover только из meta/apple-touch — без twitter и без мелкого favicon
  $: coverSrc = resolveCoverSrc(host, $covers, "");
  // Tip: twitter предпочтительнее, иначе cover
  $: tipImageSrc = resolveTipImageSrc(host, $tipImages, $covers, "");
  // Session count — без cover/favicon
  $: showCoverBg =
    !showSessionCount && !!coverSrc && (size >= COVER_MIN_SIZE || localBookmark);
  $: coverBgUrl = coverSrc;

  // Лениво: только этот видимый пузырь (idle-очередь); session host — без иконок
  $: if (bubble.url && !showSessionCount) {
    ensureIconsForAnchor({
      url: bubble.url,
      radius: bubble.r,
      isBookmark: localBookmark,
    });
  }

  /** Текст tooltip: title · visits · last visit / added / open duration */
  $: tipMeta = buildAnchorTooltip({
    title: bubble.title,
    url: bubble.url,
    visitCount: bubble.visitCount,
    lastVisitTime: bubble.lastVisitTime,
    dateAdded: bubble.dateAdded,
    isBookmark: localBookmark,
    isSession: session || !!bubble.isSession,
    openedAt: bubble.openedAt ?? bubble.lastVisitTime,
  });
  $: tooltipText = tipMeta.text;

  /** Якорь для BubbleActions / tip (тот же <a>) */
  let anchorEl: HTMLAnchorElement | null = null;
  let claimToken = 0;

  function closeMenu() {
    if (!multiButton) return;
    multiButton = false;
    releaseActiveTooltip(claimToken);
  }

  function openMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Shift+ПКМ — expand (как раньше чистый contextmenu)
    if (e.shiftKey && groupable) {
      onExpandRequest();
      return;
    }
    if (dragging || popping) return;
    // Закрыть открытый тултип — меню занимает тот же слой
    claimToken = claimActiveTooltip(closeMenu);
    multiButton = true;
  }

  async function copyToBuffer(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bubble.url);
    } catch (err) {
      console.error(err);
    }
    closeMenu();
  }

  function toggleBookmark(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    localBookmark = !localBookmark;
    onToggleBookmark();
  }

  function deleteBubble(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    onDelete();
  }

  onDestroy(() => {
    releaseActiveTooltip(claimToken);
  });

  // Drag / pop — сразу спрятать меню
  $: if (dragging || popping) closeMenu();
</script>

<!-- Обёртка двигает физикой; внутренний .bubbleDot — spawn / pop -->
<div
  class="bubbleWrap"
  class:host={bubble.kind === "host"}
  class:child={bubble.kind === "child"}
  class:dragging
  class:inflating
  class:popping
  role="group"
  style="transform: translate({tx}px, {ty}px); width: {size}px; height: {size}px;"
>
  <!-- Bubble tip: cover/og в tip если уже подгружен -->
  <Tooltip.Bubble
    content={tooltipText}
    image={tipImageSrc}
    side="bottom"
    delayDuration={400}
    disabled={dragging || popping || multiButton}
  >
    <a
      bind:this={anchorEl}
      class="bubbleDot"
      class:child={bubble.kind === "child"}
      class:host={bubble.kind === "host"}
      class:groupable
      class:expanded
      class:bookmark={localBookmark}
      class:session
      class:aged={tipMeta.aged}
      class:overflow={!!bubble.isOverflowGroup}
      class:has-cover={showCoverBg}
      class:dragging
      class:inflating
      class:popping
      class:enter-rise={enterAnim === "rise"}
      class:enter-fall={enterAnim === "fall"}
      href={bubble.url}
      rel="noopener noreferrer"
      draggable="false"
      style="animation-delay: {delay}s;"
      use:longhover={groupable && !dragging && !popping
        ? GROUP_LONGHOVER_MS
        : 86400000}
      on:mouseenter={() => {
        // Только inflate — меню только по ПКМ
        if (groupable && !dragging && !popping) onInflateStart();
      }}
      on:mouseleave={() => {
        if (groupable) onInflateCancel();
      }}
      on:longhover|preventDefault={() => {
        if (groupable && !dragging) onExpandCommit();
      }}
      on:contextmenu={openMenu}
      on:dragstart|preventDefault
      on:pointerdown={onPointerDown}
      on:click={onLinkClick}
    >
      <div class="popLayer" aria-hidden="true">
        <BubblePop active={popping} />
      </div>
      <!-- Cover: только in:fade — out блокировал unmount BubbleField при смене viewMode -->
      {#if showCoverBg && coverBgUrl}
        <span
          class="bubbleDot__cover"
          style="background-image: url('{coverBgUrl}');"
          aria-hidden="true"
          in:fade={{ duration: 480 }}
        ></span>
      {/if}
      <span class="bubbleDot__shine"></span>
      {#if groupable}
        <span class="bubbleDot__groupRing" aria-hidden="true"></span>
      {/if}
      <!-- Session host: N вкладок в центре; иначе favicon -->
      {#if showSessionCount}
        <span class="bubbleDot__tabCount" aria-hidden="true">{sessionTabCount}</span>
      {:else if !showCoverBg}
        <span class="bubbleDot__faviconWrap" in:fade={{ duration: 320 }}>
          <img
            class="bubbleDot__favicon"
            src={faviconSrc}
            alt=""
            width="22"
            height="22"
            loading="lazy"
            draggable="false"
          />
        </span>
      {/if}
      {#if bubble.isOverflowGroup && (bubble.overflowCount || 0) > 0}
        <span class="bubbleDot__overflowBadge">+{bubble.overflowCount}</span>
      {/if}
    </a>
  </Tooltip.Bubble>
</div>
<!-- ПКМ-меню — отдельный компонент (политики close ≠ tip) -->
<BubbleActions
  open={multiButton && !dragging && !popping}
  {anchorEl}
  isBookmark={localBookmark}
  onBookmark={toggleBookmark}
  onCopy={copyToBuffer}
  onDelete={deleteBubble}
  onRequestClose={closeMenu}
/>

<style lang="scss">
  .bubbleWrap {
    position: absolute;
    left: 0;
    top: 0;
    will-change: transform;
    pointer-events: none;
  }
  /* Host выше детей — inflate/hover не перекрывают дети */
  .bubbleWrap.child {
    z-index: 1;
  }
  .bubbleWrap.host {
    z-index: 3;
  }
  .bubbleWrap :global(.tooltip-root) {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }

  @keyframes bubbleSpawn {
    from {
      opacity: 0;
      transform: scale(0) translateY(24px);
    }
    to {
      opacity: 0.95;
      transform: scale(1) translateY(0);
    }
  }

  /* Скролл вниз: всплытие — позиция из JS (offscreen→target), тут только scale/fade */
  @keyframes bubbleRise {
    from {
      opacity: 0;
      transform: scale(0.45);
    }
    to {
      opacity: 0.95;
      transform: scale(1);
    }
  }

  /* Скролл вверх: падение — гравитация в timing, позиция из JS */
  @keyframes bubbleFall {
    from {
      opacity: 0;
      transform: scale(0.55);
    }
    to {
      opacity: 0.95;
      transform: scale(1);
    }
  }

  .bubbleDot {
    --hue: 200;
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-sizing: border-box;
    text-decoration: none;
    background: radial-gradient(
      circle at 30% 25%,
      hsl(var(--hue), 70%, 72%),
      hsl(var(--hue), 75%, 42%) 62%,
      hsl(var(--hue), 80%, 28%)
    );
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
    animation: bubbleSpawn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
  }
  .bubbleDot.enter-rise {
    animation-name: bubbleRise;
    animation-duration: 0.72s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  .bubbleDot.enter-fall {
    animation-name: bubbleFall;
    animation-duration: 0.58s;
    /* ease-in → ощущение гравитации */
    animation-timing-function: cubic-bezier(0.4, 0.05, 0.7, 1);
  }
  .bubbleDot.dragging {
    cursor: grabbing;
    filter: brightness(1.1);
    z-index: 2;
  }
  .bubbleWrap.dragging,
  .bubbleWrap.inflating {
    z-index: 5;
  }
  .bubbleWrap.popping {
    z-index: 6;
  }
  .bubbleDot.inflating {
    filter: brightness(1.12);
  }
  /* Во время лопания прячем контент — виден BubblePop */
  .bubbleDot.popping {
    background: transparent;
    box-shadow: none;
    animation: none;
  }
  .bubbleDot.popping > :not(.popLayer) {
    visibility: hidden;
  }
  .popLayer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }
  .bubbleDot.child {
    --hue: 165;
  }
  .bubbleDot.groupable {
    --hue: 280;
  }
  /* Сессия вкладок — тёплый teal, отличается от history/group */
  .bubbleDot.session {
    --hue: 175;
  }
  .bubbleDot.session.groupable {
    --hue: 175;
  }
  /* Давно: визит / закладка / долго открыта — приглушённое кольцо */
  .bubbleDot.aged {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.35),
      0 0 0 2px hsla(35, 40%, 55%, 0.55),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
  }
  .bubbleDot.overflow {
    --hue: 320;
  }
  /* Закладка: золотой --hue; tint поверх cover — в ::after (fade вместе с cover) */
  .bubbleDot.bookmark {
    --hue: 42;
  }
  .bubbleDot.bookmark.groupable {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0 0 2px hsla(42, 85%, 55%, 0.75),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
  }
  .bubbleDot.bookmark .bubbleDot__groupRing {
    border-color: hsla(42, 90%, 65%, 0.65);
  }
  /* Cover: картинка + полупрозрачный tint; появление через in:fade */
  .bubbleDot__cover {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    pointer-events: none;
  }
  .bubbleDot__cover::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    /* hue-tint поверх фото — тот же слой, что и fade */
    // background: radial-gradient(
    //   circle at 30% 25%,
    //   hsla(var(--hue), 70%, 72%, 0.35),
    //   hsla(var(--hue), 75%, 42%, 0.48) 62%,
    //   hsla(var(--hue), 80%, 28%, 0.65)
    // );
    pointer-events: none;
  }
  .bubbleDot.bookmark .bubbleDot__cover::after {
    // Золотой тинт для закладок — сейчас выключен (cover + hue достаточно)
  }
  .bubbleDot.expanded {
    box-shadow:
      inset 0 -0.15em 0.35em hsla(0, 0%, 0%, 0.25),
      0 0 0 3px hsla(var(--hue), 90%, 70%, 0.45),
      0 0.35em 0.75em hsla(0, 0%, 0%, 0.35);
  }
  .bubbleDot:hover {
    filter: brightness(1.08);
  }
  .bubbleDot__shine {
    position: absolute;
    top: 12%;
    left: 14%;
    width: 55%;
    height: 35%;
    border-radius: 50%;
    z-index: 1;
    /* Белый блик (не жёлтый) */
    background: radial-gradient(
      circle at top,
      rgba(255, 255, 255, 0.65),
      rgba(255, 255, 255, 0) 70%
    );
    pointer-events: none;
  }
  .bubbleDot__groupRing {
    position: absolute;
    inset: 6%;
    z-index: 1;
    border-radius: 50%;
    border: 2px solid hsla(280, 90%, 75%, 0.55);
    pointer-events: none;
  }
  .bubbleDot.session .bubbleDot__groupRing {
    border-color: hsla(175, 90%, 70%, 0.6);
  }
  .bubbleDot__faviconWrap {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
  }
  .bubbleDot__favicon {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    object-fit: contain;
    border-radius: 3px;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
    z-index: 1;
  }
  /* Session: число вкладок вместо favicon */
  .bubbleDot__tabCount {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    pointer-events: none;
    font-size: clamp(14px, 28%, 28px);
    font-weight: 700;
    line-height: 1;
    color: #e8fffb;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    font-variant-numeric: tabular-nums;
  }
  .bubbleDot__overflowBadge {
    position: absolute;
    right: 8%;
    bottom: 10%;
    min-width: 1.35rem;
    padding: 0 4px;
    border-radius: 999px;
    background: rgba(20, 12, 28, 0.85);
    color: #f8e8ff;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.35rem;
    text-align: center;
    pointer-events: none;
    z-index: 2;
  }
</style>
