<script lang="ts">
  import { onMount, onDestroy, tick, getContext, hasContext } from "svelte";
  import Icon, {
    Star,
    Trash,
    Pencil,
    Duplicate,
    ClipboardCopy,
    Globe,
  } from "svelte-hero-icons";
  import globe from "../assets/Globe.svg";
  import { fly, scale, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  export let anchor: any = {};
  let now = new Date();
  // let dateAdded: number = anchor.dateAdded || now.getTime();
  // let dateGroupModified: number = anchor.dateGroupModified || now.getTime();
  // let lastVisitTime: number = anchor.lastVisitTime || now.getTime();
  let id: number = anchor.id || 0;
  export let unfold: boolean | null = null;
  export let childrenInvisible: boolean | null = null;
  let index: number = anchor.index || 0;
  let typedCount: number = anchor.typedCount || 0;
  let parentId: number | null = anchor.parentId || null;
  let isBookmark: boolean = anchor.isBookmark || false;
  let title: string = anchor.title || "";
  let url: string = anchor.url || "";
  let visitCount: number = anchor.visitCount || 1;
  let hostVisitCount: any = anchor.hostVisitCount || 0;
  let multiButton: boolean = false;
  let deleted: boolean = false;
  let maxVisits: number = localStorage?.maxVisits * 1 || 500;

  export let weightVisits: number =
    // anchor.weightVisits ||
    Math.log10(Math.max(unfold ? visitCount : hostVisitCount, visitCount) * 1);
  let weightVisitsRadius: any = anchor.weightVisitsRadius || 50;

  let ping = "";
  try {
    let tmping: URL = new URL(url);
    tmping.searchParams.append("utm_network", "ExpressionTab_ChromeExtension");
    ping = tmping.href;
  } catch (e) {
    console.error(url);
    console.error(e);
  }
  export let host = "localhost";
  // try {
  //     host = new URL(url).host.split(":")[0] || "localhost";
  // } catch (e) {
  //     console.log("No favicon for url: ", url);
  // }

  // @todo если нет сохраненного фавикона
  // показать сначала по прямой ссылке
  // в следующий раз можно показать и кэшированный
  // let src: string = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + host;
  let src: string = globe;
  let img_data: string =
    localStorage.getItem("favicon_" + host) ||
    "https://favicon.yandex.net/favicon/" + host;
  // @todo написать поиск фавикон по url.path

  if (img_data.length > 0) {
    src = img_data;
  }

  // function remove(todo) {
  // 	todos = todos.filter(t => t !== todo);
  // }

  // Чтобы получить значок для домена, используйте:
  // https://s2.googleusercontent.com/s2/favicons?domain=www.stackoverflow.com
  // http://www.google.com/s2/favicons?domain=somedomain.com

  // Чтобы получить значок для URL-адреса, используйте:
  // https://s2.googleusercontent.com/s2/favicons?domain_url=https://www.stackoverflow.com
  // chrome://favicon2/?size=16&scale_factor=1x&page_url=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSckRt0pts60MaYbNv73y5tiIMjLsfpuEdHwrsFXr9v6Bi21fg%2Fviewform&allow_google_server_fallback=0

  async function copyToBuffer(e: Event, copyText: string) {
    e.preventDefault();
    document.addEventListener(
      "copy",
      function(e) {
        e.clipboardData?.setData("text/plain", copyText);
        e.preventDefault();
      },
      true
    );
    document.execCommand("copy");
    console.log("copied text : ", copyText);
    //  alert('copied text: ' + copyText);
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

{#if !deleted}
  <!-- {@debug url} -->
  <!-- {@debug weightVisits}} -->
  <!-- {#if !new RegExp("^" + ignoreUrl.join("|")).test(url)}
        class:titleVisible -->
  <!-- transition:scale="{{duration: 500, delay: 500, opacity: 0.5, start: 0.5, easing: quintOut}}" -->
  <!-- 

        width:{weightVisits * 100 + 50}px;
        height:{weightVisits * 100 + 50}px;
        z-index: -{Math.ceil(weightVisits * 1000)};  

        on:contextmenu|stopPropagation|preventDefault="{() => {
				adjusting = !adjusting;
				if (adjusting) selected = circle;
			}}"
    class="rounded-full"
    on:mouseover={() => (multiButton = true)}
    on:mouseleave={() => (multiButton = false)}
    in:slide={{ duration: 700, delay: 300 }}
    out:slide={{ duration: 700, delay: 300 }}
    out:scale={{duration: 330, delay: 20, opacity: 0.1, start: 0.5, easing: quintOut}}
    in:fly={{ x: -90, y: -20, duration: 350 }}
 -->
  <anchor
    in:scale={{ duration: 330, opacity: 0.5, start: 0.5 }}
    out:fly={{ x: -70, y: -20, duration: 350 }}
    {title}
    style="
        margin: {weightVisits * 10 + 10}px; 
        "
    class:isBookmark
    class:invisible={!childrenInvisible}
    on:contextmenu|stopPropagation|preventDefault={() => (multiButton = true)}
    on:mouseleave|stopPropagation|preventDefault={() => (multiButton = false)}
  >
    <bgcircle
      style="
        transform: scale({(weightVisits * 1 + 1).toFixed(2)});
        background-image: url('{src}');
"
    />
    <slot />
    <a {ping} href={url}>
      <anchoricon
        transition:scale={{
          duration: 500,
          delay: 50,
          opacity: 0.5,
          start: 0.5,
          easing: quintOut,
        }}
        style="background-image: url('{src}');"
      />
      {#if unfold === false}
        <anchoricon
          class="subicon"
          in:fly={{ x: 95, duration: 300 }}
          out:fly={{ x: 70, duration: 350 }}
          style="background-image: url('{src}');"
        />
        <anchoricon
          class="subicon"
          in:fly={{ x: 55, duration: 300 }}
          out:fly={{ x: 50, duration: 350 }}
          style="background-image: url('{src}');
                transform: scale(0.56) translate(51px, -18px);"
        />
      {/if}

      <span>
        <strong>{title}</strong> | {isBookmark ? "⭐" : visitCount + " visits"}
      </span>
    </a>
    {#if multiButton}
      <div
        class:multiButton
        in:fly={{ x: 5, duration: 300 }}
        out:fly={{ x: 5, duration: 300 }}
        on:mouseenter|stopPropagation|preventDefault={() => {}}
      >
        <button
          class:isBookmark
          title="Bookmark"
          on:click={(e) => changeBookmark()}
        >
          <Icon src={Star} solid size="22" />
        </button>
        <!-- {#if isBookmark}
      {:else}
        {/if}
     {#if isBookmark}
                <button class="fas fa-comment" title="Edit">
                    <Icon src={Pencil} solid size="22" />
                </button>
            {/if} -->
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

  @keyframes width-grow {
    0% {
      width: 0px;
    }
    100% {
      width: auto;
    }
  }
  anchoricon {
    height: 18px;
    width: 18px;
    margin: 6px;
    transform: scale(1.2);
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 2px;
    background-image: url("../assets/Globe.svg");
    background-size: contain;
    filter: drop-shadow(3px 1px 4px rgba(20, 20, 20, 0.52));
  }
  anchoricon.subicon {
    position: absolute;
    z-index: -1;
    opacity: 0.2;
    transform: scale(0.9) translate(16px, -8px);
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
    position: relative;
    padding-right: 0px;
    box-sizing: border-box;
    animation: -global-width-grow-anchor 1s
      cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
    transition: all 0.6s ease;
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
    filter: brightness(1) contrast(1) saturate(1.3) blur(5px);
    box-shadow: 5px 5px 10px #222;
    // animation: pulseEffect 3s both infinite;
  }

  // $percent: 1%;
  // @for $i from 1 through 20 {
  // :global(* bgcircle:nth-of-type(#{$i}) ) {
  bgcircle {
    animation: pulseEffect infinite;
    animation-duration: 10s;
    transition-delay: 10s;
    animation-delay: 10s;
  }
  // }

  anchor.isBookmark {
    background-color: #484848;
    border-width: 7px !important;
    border-color: #353535;
    border-style: solid;
    padding: 3px;
  }
  anchor .multiButton {
    z-index: -1000;
    position: absolute;
    top: 1.25rem;
    left: 1.25rem;
    border-radius: 100%;
    width: 0rem;
    height: 0rem;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition: 0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s;
  }
  anchor .multiButton:hover {
    z-index: 1000;
  }
  anchor .multiButton button {
    display: grid;
    place-items: center;
    position: absolute;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 100%;
    background: var(--background);
    color: var(--text);
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition: left, top 0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s;
    box-shadow: 0 0 0rem -0.25rem var(--background);
  }
  anchor .multiButton button:hover {
    background: var(--text);
    color: var(--background);
    box-shadow: 0 0 1rem -0.25rem var(--background);
  }
  anchor .multiButton button.isBookmark {
    background-color: #f90;
  }
  anchor .multiButton button:first-child:nth-last-child(1):nth-child(1),
  anchor .multiButton button:first-child:nth-last-child(1) ~ *:nth-child(1) {
    left: 25%;
    top: 25%;
  }
  anchor .multiButton button:first-child:nth-last-child(2):nth-child(1),
  anchor .multiButton button:first-child:nth-last-child(2) ~ *:nth-child(1) {
    left: 37.5%;
    top: 18.75%;
  }
  anchor .multiButton button:first-child:nth-last-child(2):nth-child(2),
  anchor .multiButton button:first-child:nth-last-child(2) ~ *:nth-child(2) {
    left: 18.75%;
    top: 37.5%;
  }
  anchor .multiButton button:first-child:nth-last-child(3):nth-child(1),
  anchor .multiButton button:first-child:nth-last-child(3) ~ *:nth-child(1) {
    left: 50%;
    top: 15.625%;
  }
  anchor .multiButton button:first-child:nth-last-child(3):nth-child(2),
  anchor .multiButton button:first-child:nth-last-child(3) ~ *:nth-child(2) {
    left: 25%;
    top: 25%;
  }
  anchor .multiButton button:first-child:nth-last-child(3):nth-child(3),
  anchor .multiButton button:first-child:nth-last-child(3) ~ *:nth-child(3) {
    left: 15.625%;
    top: 50%;
  }
  anchor .multiButton button:first-child:nth-last-child(4):nth-child(1),
  anchor .multiButton button:first-child:nth-last-child(4) ~ *:nth-child(1) {
    left: 62.5%;
    top: 18.75%;
  }
  anchor .multiButton button:first-child:nth-last-child(4):nth-child(2),
  anchor .multiButton button:first-child:nth-last-child(4) ~ *:nth-child(2) {
    left: 37.5%;
    top: 18.75%;
  }
  anchor .multiButton button:first-child:nth-last-child(4):nth-child(3),
  anchor .multiButton button:first-child:nth-last-child(4) ~ *:nth-child(3) {
    left: 18.75%;
    top: 37.5%;
  }
  anchor .multiButton button:first-child:nth-last-child(4):nth-child(4),
  anchor .multiButton button:first-child:nth-last-child(4) ~ *:nth-child(4) {
    left: 18.75%;
    top: 62.5%;
  }
  anchor:hover .multiButton,
  anchor .multiButton:focus-within {
    z-index: -1;
    width: 10rem;
    height: 10rem;
    opacity: 1;
  }
  anchor a {
    color: #ddd;
    text-decoration: none;
    font-size: 13px;
    line-height: 20px;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    align-content: flex-end;
  }
  anchor:hover a {
    opacity: 1;
  }
  .titleVisible anchor a span {
    display: block;
    min-width: 100px;
    width: auto;
    opacity: 1;
    transition: width 0.6s ease, opacity 1s linear;
  }
  anchor a span {
    display: block;
    width: 0px;
    overflow: hidden;
    opacity: 0;
  }

  @keyframes -global-width-grow-anchor {
    0% {
      width: 50px;
    }
    100% {
      width: auto;
    }
  }
  @keyframes pulseEffect {
    0% {
      opacity: 1;
    }
    40% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
</style>
