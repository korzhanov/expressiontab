import { describe, expect, it } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("BubblePop", () => {
  it("credits CodePen source and defines pop keyframes", () => {
    const src = readFileSync(join(import.meta.dir, "BubblePop.svelte"), "utf8");
    expect(src).toContain("codepen.io/jkantner/pen/poYZMXX");
    expect(src).toContain("bubblePopBall");
    expect(src).toContain("bubblePopDrop");
  });

  it("BubbleDot wires inflate/pop before group expand", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    expect(src).toContain("BubblePop");
    expect(src).toContain("onInflateStart");
    expect(src).toContain("onExpandCommit");
    expect(src).toContain("popping");
  });

  it("BubbleDot shows Bookmark Copy Delete menu and larger favicon", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    const actions = readFileSync(
      join(import.meta.dir, "BubbleActions.svelte"),
      "utf8"
    );
    expect(actions).toContain('aria-label="Bookmark"');
    expect(actions).toContain('aria-label="Copy url"');
    expect(actions).toContain('aria-label="Delete"');
    expect(src).toContain("onToggleBookmark");
    expect(src).toContain("onDelete");
    expect(src).toContain('width="22"');
    // Меню только по ПКМ, на портале как тултипы
    expect(src).toContain("BubbleActions");
    expect(actions).toContain("bubbleActions");
    expect(actions).toContain("tooltipPortal");
    expect(src).toContain("on:contextmenu={openMenu}");
    expect(src).not.toContain("showMenu()");
    // Tip: Bubble-политика (не close-on-scroll); не гасим на inflate
    expect(src).toContain("Tooltip.Bubble");
    expect(src).toContain("resolveFaviconSrc(host, $favicons, globe, bubble.url)");
    expect(src).toContain("disabled={dragging || popping || multiButton}");
    expect(src).not.toContain("inflating || popping");
  });

  it("bookmark bubbles use gold hue, white shine, no star under favicon", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleDot.svelte"), "utf8");
    // Белый блик остаётся общим
    expect(src).toContain("rgba(255, 255, 255, 0.65)");
    // Закладка — золотой --hue + tint на cover::after (fade вместе с картинкой)
    expect(src).toMatch(/\.bubbleDot\.bookmark\s*\{[^}]*--hue:\s*42/);
    expect(src).toContain("class:has-cover={showCoverBg}");
    expect(src).toContain("bubbleDot__cover::after");
    expect(src).toContain("hsla(42");
    expect(src).toContain("bubbleDot__cover");
    // Только in:fade — out блокировал unmount BubbleField при смене viewMode
    expect(src).toContain("in:fade");
    expect(src).not.toContain("transition:fade");
    // Cover только при реальной крупной иконке — не подставляем favicon
    expect(src).toContain("coverBgUrl = coverSrc");
    expect(src).toContain("image={tipImageSrc}");
    expect(src).toContain("resolveTipImageSrc");
    expect(src).not.toContain("localBookmark ? faviconSrc");
    expect(src).not.toContain("bubbleDot__star");
    expect(src).not.toContain("starred={localBookmark}");
  });

  it("BubbleField runs circle expand nav transition before open", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleField.svelte"), "utf8");
    expect(src).toContain("navBurst");
    expect(src).toContain("navBurstPortal");
    expect(src).toContain("viewportCoverRadius");
    expect(src).toContain("bubbleNavHue");
    expect(src).toContain("window.location.href");
  });

  it("BubbleField spawns children before pop, then shrinks to linkR; fold pops kids", () => {
    const src = readFileSync(join(import.meta.dir, "BubbleField.svelte"), "utf8");
    const fnAt = src.indexOf("function commitExpandPop");
    expect(fnAt).toBeGreaterThan(0);
    const body = src.slice(fnAt, fnAt + 4500);
    // Spawn раньше присвоения poppingId; LEAD_MS и shrink к linkR
    expect(body).toContain("expandHost({");
    expect(body).toContain("expandOverflowNode");
    // Хост-путь: последний expandHost до ближайшего poppingId после него
    const hostExpand = body.lastIndexOf("expandHost({");
    const popAssign = body.indexOf("poppingId = b.id", hostExpand);
    expect(hostExpand).toBeGreaterThan(0);
    expect(popAssign).toBeGreaterThan(hostExpand);
    expect(body).toContain("GROUP_SPAWN_LEAD_MS");
    expect(body).toContain("startShrinkToWeight");
    expect(body).toContain("b.linkR");
    expect(body).toContain("skipSpawn");
    expect(src).toContain("listHostDescendants");
    expect(src).toContain("commitCollapseAbsorb");
    expect(src).toContain("GROUP_ABSORB_MS");
    expect(src).toContain("poppingChildIds");
    // Hover на раскрытой: рост → leave откат
    expect(src).toContain("onExpandedHoverGrow");
    expect(src).toContain("expandedGrow");
    expect(src).toContain("GROUP_EXPANDED_HOVER_GROW_MS");
    expect(src).toContain("GROUP_EXPANDED_HOVER_SHRINK_MS");
    // Inflate/deflate не разгоняет всё поле
    expect(src).toContain("beginSoftRadiusAdjust");
    expect(src).toContain("nudgeSim");
    expect(src).not.toContain("reheat(world, 0.55)");
    expect(src).toContain("GROUP_MAX_CHILDREN");
    expect(src).not.toContain("slice(1, 25)");
    expect(src).not.toContain("maxChildren: 24");
    // Unfold: сжатие к linkR (не cluster inflate)
    expect(src).toContain("groupR → linkR");
    expect(src).not.toContain("clusterRadiusFromChildRadii");
    expect(src).toContain("startCraterFill");
    expect(src).toContain("beginDragCollisions");
    expect(src).toContain("endDragCollisions");
    // При drag тоже bounce от краёв (соседи не улетают за блок)
    expect(src).toContain("bounceBubblesAtWorldEdges(world.nodes, world.width, world.height)");
    const tickAt = src.indexOf("function onTick");
    expect(tickAt).toBeGreaterThan(0);
    const tickBody = src.slice(tickAt, tickAt + 900);
    expect(tickBody.indexOf("bounceBubblesAtWorldEdges")).toBeLessThan(
      tickBody.indexOf("if (dragMoved && dragBubble)")
    );
    // Hover: дети с 2с по очереди, на 3с flush
    expect(src).toContain("scheduleHoverChildSpawn");
    expect(src).toContain("flushPendingChildren");
    expect(src).toContain("GROUP_CHILD_SPAWN_AT_MS");
    expect(src).toContain("GROUP_CHILD_STAGGER_MS");
    expect(src).toContain("keepParentR: true");
    // При drag ResizeObserver не раздувает мир
    expect(src).toContain("if (!world || dragBubble) return");
    expect(src).toContain("groupR ?? n.baseR");
    // Fold: рост только до groupR
    const foldAt = src.indexOf("function commitCollapseAbsorb");
    expect(foldAt).toBeGreaterThan(0);
    const foldBody = src.slice(foldAt, foldAt + 1200);
    expect(foldBody).toContain("const r1 = groupR");
    expect(foldBody).not.toContain("clusterRadiusFromChildRadii");
  });

  it("BubbleField caps concurrent unfolds at MAX_UNFOLDED_HOSTS", () => {
    const src = readFileSync(
      join(import.meta.dir, "BubbleField.svelte"),
      "utf8"
    );
    expect(src).toContain("MAX_UNFOLDED_HOSTS");
    expect(src).toContain("registerExpanded");
    expect(src).toContain("noteUnfoldedHost");
  });
});
