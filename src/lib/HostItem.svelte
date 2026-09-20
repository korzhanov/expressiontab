<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import Icon, { ChevronDown } from "svelte-hero-icons";
  import AnchoreItem from "./AnchoreItem.svelte";
  import { longhover, GROUP_LONGHOVER_MS } from "./longhover";
  import { nodesList } from "./stores";
  import { getUnfoldSlice, UNFOLD_PAGE_SIZE } from "./bookmarks";
  import {
    foldHost,
    unfoldHost,
    unfoldedHostOrder,
  } from "./unfold-limit";
  import * as Tooltip from "./components/ui/tooltip";

  export let hostItem: any;

  $: anchores = hostItem?.nodes || [];
  $: hostAnchore = $nodesList[anchores[0]] || {};
  $: otherAnchores = anchores[1] ? anchores.slice(1) : [];
  $: isSessionGroup = !!(hostItem?.isSession || hostAnchore?.isSession);
  // Стабильный ключ группы для LRU unfold
  $: hostKey =
    hostItem?.host || hostAnchore?.host || String(anchores[0] ?? "");
  // Общий лимит 3 — подписка на store, не локальный флаг
  $: unfold = !!hostKey && $unfoldedHostOrder.includes(hostKey);
  $: groupHint = `${otherAnchores.length} more — arrow toggles, hover 3s or right-click`;
  $: toggleLabel = unfold
    ? `Hide ${otherAnchores.length} more links`
    : `Show ${otherAnchores.length} more links`;

  let childrenInvisible = false;
  let visibleChildCount = UNFOLD_PAGE_SIZE;

  $: unfoldSlice = getUnfoldSlice(otherAnchores, visibleChildCount);

  const titleVisibleStore = getContext("titleVisible");

  // VirtualScroll recycle: свернуть при unmount — иначе remount с unfold
  // даёт ряд высотой >> estimateSize и ломает список
  onDestroy(() => {
    if (hostKey) foldHost(hostKey);
  });

  function openGroup(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hostKey) return;
    if (!unfold) {
      unfoldHost(hostKey);
      childrenInvisible = true;
      visibleChildCount = UNFOLD_PAGE_SIZE;
    }
  }

  function toggleGroup(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!hostKey) return;
    if (unfold) {
      foldHost(hostKey);
      childrenInvisible = false;
      visibleChildCount = UNFOLD_PAGE_SIZE;
    } else {
      openGroup();
    }
  }

  /** Клик по группе: не трогаем <a>/кнопки — иначе ссылки не открываются */
  function onGroupClick(e: MouseEvent) {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.("a, button, .multiButton")) return;
    toggleGroup(e);
  }

  function showMore(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    visibleChildCount = unfoldSlice.nextCount;
  }
</script>

{#if hostItem}
  {#if anchores.length < 2}
    {#each anchores as item (item)}
      {#if $nodesList[item]?.url}
        <AnchoreItem
          anchor={$nodesList[item]}
          childrenInvisible={true}
          titleVisible={$titleVisibleStore}
        />
      {/if}
    {/each}
  {:else}
    <Tooltip.List
      content={groupHint}
      side="bottom"
      delayDuration={550}
      block={!!$titleVisibleStore}
    >
      <anchorGroup
        class="hovicon effect-8"
        class:lined={$titleVisibleStore}
        class:session={isSessionGroup}
        use:longhover={GROUP_LONGHOVER_MS}
        on:longhover|stopPropagation|preventDefault={openGroup}
        on:contextmenu|stopPropagation|preventDefault={openGroup}
        on:click|stopPropagation={onGroupClick}
        class:unfold
      >
        {#if hostAnchore?.url}
          <AnchoreItem
            anchor={hostAnchore}
            {unfold}
            childrenInvisible={true}
            titleVisible={$titleVisibleStore}
          />
        {/if}
        <!-- Явная кнопка раскрытия группы (стандартный button + chevron) -->
        <Tooltip.List content={toggleLabel} side="left" delayDuration={250}>
          <button
            type="button"
            class="groupToggle"
            class:lined={$titleVisibleStore}
            aria-expanded={unfold}
            aria-label={toggleLabel}
            on:click|stopPropagation={toggleGroup}
          >
            <Icon src={ChevronDown} solid size={$titleVisibleStore ? "18" : "16"} />
            {#if $titleVisibleStore}
              <span class="groupToggleCount">{otherAnchores.length}</span>
            {/if}
          </button>
        </Tooltip.List>
      </anchorGroup>
    </Tooltip.List>
    {#if unfold}
      <div
        class="groupChildren"
        class:lined={$titleVisibleStore}
      >
        {#each unfoldSlice.visible as item (item)}
          {#if $nodesList[item]?.url}
            <AnchoreItem
              anchor={$nodesList[item]}
              childrenInvisible={childrenInvisible}
              titleVisible={$titleVisibleStore}
              nested={!!$titleVisibleStore}
            />
          {/if}
        {/each}
        {#if unfoldSlice.hasMore}
          <button class="showMore" type="button" on:click={showMore}>
            +{otherAnchores.length - unfoldSlice.visible.length} more
          </button>
        {/if}
      </div>
    {/if}
  {/if}
{/if}

<style lang="scss">
  anchorGroup {
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    width: 50px;
    height: 50px;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    align-items: baseline;
    flex-direction: row;
    border: 12px solid #1b1b1bcf !important;
    filter: saturate(1.12);
    background-color: #6c519433;
    border-radius: 50%;
    margin: 16px;
    transition: border-color 0.35s var(--ease-out),
      background-color 0.35s var(--ease-out);
  }
  anchorGroup.lined {
    width: 100%;
    height: auto;
    min-height: 48px;
    border-radius: 12px;
    border-width: 1px !important;
    border-color: rgba(255, 255, 255, 0.09) !important;
    margin: 4px 0;
    // Одна строка: заголовок хоста + кнопка «ещё N» (без переноса)
    flex-wrap: nowrap;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 2px 10px 2px 2px;
    filter: none;
    background-color: rgba(255, 255, 255, 0.04);
    gap: 6px;
  }
  // Заголовок занимает оставшуюся ширину; иначе .tooltip-root.block { width:100% } выталкивает кнопку вниз
  anchorGroup.lined :global(.tooltip-root.block) {
    flex: 1 1 0%;
    min-width: 0;
    width: auto;
    max-width: none;
    overflow: hidden; // ellipsis заголовка, не выталкивает кнопку
  }
  // Обёртка groupToggle: слева от заголовка, без сжатия и без переноса
  anchorGroup.lined :global(.tooltip-root:not(.block)) {
    flex: 0 0 auto;
    order: -1;
  }

  .groupToggle {
    --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    margin: 0;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: #eee;
    line-height: 0;
    cursor: pointer;
    z-index: 5;
    transition: background-color 0.25s var(--ease-out), border-color 0.25s var(--ease-out),
      transform 0.25s var(--ease-out), color 0.25s ease;
  }
  .groupToggle:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.28);
  }
  .groupToggle :global(svg) {
    display: block;
    margin: 0;
    transition: transform 0.3s var(--ease-out);
  }
  .groupToggle[aria-expanded="true"] :global(svg) {
    transform: rotate(180deg);
  }
  // Bubble: компактный бейдж на группе
  .groupToggle:not(.lined) {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 1.5rem;
    height: 1.5rem;
    background: #1f1f1f;
    border-color: rgba(255, 255, 255, 0.25);
  }
  .groupToggle.lined {
    width: auto;
    min-width: 2.25rem;
    height: 2rem;
    padding: 0 8px;
    border-radius: 8px;
    margin-right: 4px;
  }
  .groupToggleCount {
    font-size: 12px;
    font-weight: 650;
    line-height: 1;
    color: rgba(255, 255, 255, 0.8);
    font-variant-numeric: tabular-nums;
  }
  anchorGroup:hover {
    border: 12px solid #1d1d1df2 !important;
  }
  anchorGroup.lined:hover {
    border-width: 1px !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
  }
  /* Session tabs — teal accent в lined */
  anchorGroup.lined.session {
    border-color: rgba(64, 200, 180, 0.35) !important;
    background-color: rgba(40, 160, 140, 0.1);
  }
  anchorGroup.lined.session:hover {
    border-color: rgba(64, 200, 180, 0.5) !important;
    background-color: rgba(40, 160, 140, 0.16);
  }

  // Вложенные ссылки группы в lined — отступ + направляющая слева
  .groupChildren.lined {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 4px 0 14px 18px;
    padding: 6px 0 6px 16px;
    border-left: 2px solid rgba(255, 255, 255, 0.14);
    animation: groupReveal 0.38s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes groupReveal {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .showMore {
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    padding: 8px 14px;
    margin: 6px 0 2px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 550;
    letter-spacing: 0.02em;
    align-self: flex-start;
    transition: background-color 0.25s ease, color 0.25s ease,
      border-color 0.25s ease;
  }
  .showMore:hover {
    background: rgba(255, 255, 255, 0.09);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.28);
  }

  .hovicon {
    cursor: pointer;
    position: relative;
  }
  .hovicon:hover {
    // Меню/пульс поверх соседних dial в ряду
    z-index: 40;
  }
  .hovicon:after {
    pointer-events: none;
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    content: "";
    box-sizing: content-box;
  }
  .hovicon:before {
    display: block;
    -webkit-font-smoothing: antialiased;
  }
  .hovicon.effect-8 {
    transition: background 0.35s cubic-bezier(0.22, 1, 0.36, 1);
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
    /* без scale на самом элементе — иначе дёрганье при скролле */
    background-color: #ffffffcf;
  }
  /* Пульсация (sonar) при наведении — только bubble view */
  .hovicon.effect-8:hover:after {
    animation: sonarEffect 1.4s ease-out 0s infinite;
  }
  /* Lined: без sonar и без белой вспышки — читаемый текст */
  .hovicon.effect-8.lined:hover {
    background-color: rgba(255, 255, 255, 0.07);
  }
  .hovicon.effect-8.lined:hover:after,
  .unfold.hovicon.effect-8:hover:after {
    animation: none;
    opacity: 0;
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
