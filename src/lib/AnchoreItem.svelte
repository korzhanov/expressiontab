<script lang="ts">
    export let dateAdded: number;
    export let id: number;
    export let index: number;
    export let parentId: number;
    export let title: string;
    export let url: string = "";
    export let radius: number = 20;
    let ignoreUrl = [
        "chrome:",
        "chrome-extension:",
        "javascript:",
        "file:",
        "data:"
    ];
    let src = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + url;
    // let src = "chrome://favicon/?size=16&scale_factor=1x&page_url=" + encodeURIComponent(url);
    // let src = "chrome://favicon2/?size=16&scale_factor=1x&page_url=" + encodeURI(url);
    // Чтобы получить значок для домена, используйте:
    // https://s2.googleusercontent.com/s2/favicons?domain=www.stackoverflow.com
    // http://www.google.com/s2/favicons?domain=somedomain.com

    // Чтобы получить значок для URL-адреса, используйте:
    // https://s2.googleusercontent.com/s2/favicons?domain_url=https://www.stackoverflow.com
// chrome://favicon2/?size=16&scale_factor=1x&page_url=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSckRt0pts60MaYbNv73y5tiIMjLsfpuEdHwrsFXr9v6Bi21fg%2Fviewform&allow_google_server_fallback=0
function onAnchorClick(event) {
  chrome.tabs.create({
    selected: true,
    url: event.srcElement.href
  });
  return false;
}
</script>
<!-- {@debug url} -->
{#if !new RegExp("^" + ignoreUrl.join("|")).test(url)}
    <anchor {title} class="w-40 h-40 rounded-full">
        <!-- <img
            class="img-blur"
            {src}
        /> -->
        <blur style="background-image: url({src});"  />
        <img class="img-icon" {src} alt={title} />
        <a href={url}>
            <!-- <svg>
        <circle cx="0" cy="0" r={radius} style="fill:#cccccc" />
    </svg> -->
            <!-- <picture> -->
            <!-- <source srcset="../assets/svelte.png" media="(min-width: 600px)" /> -->

            <!-- </picture> -->
            <!-- {title} -->
        </a>
    </anchor>
{/if}

<style lang="postcss">
    anchor {
        /* width: 50px;
        height: 50px;
        border-radius: 50px;
        padding: 2%; */
        text-overflow: ellipsis;
        overflow: hidden;
        /* display: inline-block; */
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        /* background-color: #fff9;
        background-color: rgba(255, 255, 255, 0.5); */
        /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px); */
        /* background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        transition: all 0.3s ease; */
    }
    blur {
        /* filter: blur(10px); */
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        width: 100%;
        height: 100%;
        position: absolute;
        
        background-color: #fff9;
        background-color: rgba(255, 255, 255, 0.5);
        /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px); */
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        transition: all 0.3s ease;
    }

    anchor a {
        position: absolute;
        text-overflow: ellipsis;
        font-size: 10px;
        line-height: 12px;
        margin: auto;
        height: 100%;
        width: 100%;
        display: block;
        text-decoration: none;
        color: #555;
        opacity: 0;
    }

    anchor:hover blur {
        /* display: inline-block; */
        -webkit-animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
    }

    anchor:hover a {
        opacity: 1;
        position: relative;
    }
    .img-blur {
        /* filter: blur(10px); */
        /* -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px); */
        width: 100%;
        height: 100%;
        position: absolute;
    }
    .img-icon {
        z-index: 10;
    }

    @-webkit-keyframes flip-diagonal-1-fwd {
        0% {
            -webkit-transform: translateZ(0) rotate3d(1, 1, 0, 0deg);
            transform: translateZ(0) rotate3d(1, 1, 0, 0deg);
        }
        100% {
            -webkit-transform: translateZ(160px) rotate3d(1, 1, 0, 180deg);
            transform: translateZ(160px) rotate3d(1, 1, 0, 180deg);
        }
    }
    @keyframes flip-diagonal-1-fwd {
        0% {
            -webkit-transform: translateZ(0) rotate3d(1, 1, 0, 0deg);
            transform: translateZ(0) rotate3d(1, 1, 0, 0deg);
        }
        100% {
            -webkit-transform: translateZ(160px) rotate3d(1, 1, 0, 180deg);
            transform: translateZ(160px) rotate3d(1, 1, 0, 180deg);
        }
    }
</style>
