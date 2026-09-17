<script lang="ts">
  import { getContext } from "svelte";
  import AnchoreItem from "./AnchoreItem.svelte";
  import { longhover, GROUP_LONGHOVER_MS } from "./longhover";
  import { nodesList } from "./stores";
  import { getUnfoldSlice, UNFOLD_PAGE_SIZE } from "./bookmarks";

  export let hostItem: any;

  $: anchores = hostItem?.nodes || [];
  $: hostAnchore = $nodesList[anchores[0]] || {};
  $: otherAnchores = anchores[1] ? anchores.slice(1) : [];

  let unfold = false;
  let childrenInvisible = false;
  let visibleChildCount = UNFOLD_PAGE_SIZE;

  $: unfoldSlice = getUnfoldSlice(otherAnchores, visibleChildCount);

  const titleVisibleStore = getContext("titleVisible");

  function openGroup(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!unfold) {
      unfold = true;
      childrenInvisible = true;
      visibleChildCount = UNFOLD_PAGE_SIZE;
    }
  }

  function toggleGroup(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (unfold) {
      unfold = false;
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
    <anchorGroup
      class="hovicon effect-8"
      class:lined={$titleVisibleStore}
      use:longhover={GROUP_LONGHOVER_MS}
      on:longhover|stopPropagation|preventDefault={openGroup}
      on:contextmenu|stopPropagation|preventDefault={openGroup}
      on:click|stopPropagation={onGroupClick}
      class:unfold
      title="{otherAnchores.length} more links — click icon to open, hover 3s or right-click to expand"
    >
      {#if hostAnchore?.url}
        <AnchoreItem
          anchor={hostAnchore}
          {unfold}
          childrenInvisible={true}
          titleVisible={$titleVisibleStore}
        />
      {/if}
    </anchorGroup>
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
    min-height: 44px;
    border-radius: 10px;
    border-width: 1px !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    margin: 2px 0;
    justify-content: flex-start;
    padding: 0;
    filter: none;
    background-color: rgba(255, 255, 255, 0.03);
  }
  anchorGroup:hover {
    border: 12px solid #1d1d1df2 !important;
  }
  anchorGroup.lined:hover {
    border-width: 1px !important;
    border-color: rgba(255, 255, 255, 0.14) !important;
  }

  // Вложенные ссылки группы в lined — отступ + направляющая слева
  .groupChildren.lined {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 2px 0 10px 14px;
    padding: 4px 0 4px 14px;
    border-left: 2px solid rgba(255, 255, 255, 0.12);
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
    background: transparent;
    color: #aaa;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 6px 12px;
    margin: 4px 0;
    cursor: pointer;
    font-size: 12px;
    align-self: flex-start;
    transition: background-color 0.25s ease, color 0.25s ease,
      border-color 0.25s ease;
  }
  .showMore:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #eee;
    border-color: rgba(255, 255, 255, 0.2);
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
