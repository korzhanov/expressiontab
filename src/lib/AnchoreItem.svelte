<script lang="ts">
    import { onMount, onDestroy, tick, getContext, hasContext } from "svelte";
    // import {
    //     persist,
    //     indexedDBStorage
    //     // ,localStorage
    // } from "@macfja/svelte-persistent-store";
    // import { writable } from "svelte/store";
    // import TailwindCSS from "./TailwindCSS.svelte";
    import { fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    let now = new Date();
    export const dateAdded: number = now.getTime();
    export const dateGroupModified: number = now.getTime();
    export const lastVisitTime: number = now.getTime();
    export const id: number = 0;
    export const index: number = 0;
    export const typedCount: number = 0;
    export const parentId: number | null = null;
    export const visitCount: number = 0;
    export const hostVisitCount: number = 0;
    let maxVisits: number = hostVisitCount || visitCount;
    if (hasContext('maxVisits')) {
		maxVisits = Math.max(getContext('maxVisits'), maxVisits);
	}
    export let weightVisits: number =
        maxVisits / Math.max(hostVisitCount, visitCount)*400;
    export let isBookmark: boolean = !!parentId;
    export let title: string = "";

    export let url: string = "";
    let ignoreUrl = [
        "chrome:",
        "chrome-extension:",
        "javascript:",
        "file:",
        "data:"
    ];
    export let host = "localhost";
    try {
        host = new URL(url).host.split(":")[0] || "localhost";
    } catch (e) {
        console.log("No favicon for url: ", url);
    }
    let src: string =
        "https://s2.googleusercontent.com/s2/favicons?domain_url=" + host;
    let img_data: string = localStorage.getItem("favicon_" + host) || "";
    // let img_data = persist(writable(""), localStorage(), "favicon_" + host);

    // getBase64Image("favicon_" + host, src);
    // if ($img_data.length == 0) {
    if (img_data.length > 0) {
        src = img_data;
    }
    // if (img_data.length == 0) {
    //     // let imgpromise = getBase64Image("favicon_" + host, src);
    //     setTimeout(function() {
    //         toDataURL(src, function(dataUrl: any) {
    //             // console.log("RESULT:", dataUrl);
    //             tick();
    //             // $img_data = dataUrl;
    //             console.log("new favicon saved from", host);
    //             localStorage.setItem("favicon_" + host, dataUrl);
    //             // img_data = dataUrl;
    //         });
    //     }, 15000);
    //     // console.log(imgpromise.then());
    // } else {
    //     // src = $img_data;
    //     src = img_data;
    // }

    // async function toDataURL(urll: string, callback: any) {
    //     var xhr = new XMLHttpRequest();
    //     xhr.onload = function() {
    //         var reader = new FileReader();
    //         reader.onloadend = function() {
    //             callback(reader.result);
    //         };
    //         reader.readAsDataURL(xhr.response);
    //     };
    //     xhr.open("GET", urll);
    //     xhr.responseType = "blob";
    //     xhr.send();
    // }
    // onMount(() => {});
    // onDestroy(() => {});

    // let src = "chrome://favicon/?size=16&scale_factor=1x&page_url=" + encodeURIComponent(url);
    // let src = "chrome://favicon2/?size=16&scale_factor=1x&page_url=" + encodeURI(url);
    // Чтобы получить значок для домена, используйте:
    // https://s2.googleusercontent.com/s2/favicons?domain=www.stackoverflow.com
    // http://www.google.com/s2/favicons?domain=somedomain.com

    // Чтобы получить значок для URL-адреса, используйте:
    // https://s2.googleusercontent.com/s2/favicons?domain_url=https://www.stackoverflow.com
    // chrome://favicon2/?size=16&scale_factor=1x&page_url=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSckRt0pts60MaYbNv73y5tiIMjLsfpuEdHwrsFXr9v6Bi21fg%2Fviewform&allow_google_server_fallback=0
    // function onAnchorClick(event) {
    //     chrome.tabs.create({
    //         selected: true,
    //         url: event.srcElement.href
    //     });
    //     return false;
    // }

    //
</script>

<!-- {@debug url} -->
<!-- {#if !new RegExp("^" + ignoreUrl.join("|")).test(url)}
        class:titleVisible -->
<!-- transition:scale="{{duration: 500, delay: 500, opacity: 0.5, start: 0.5, easing: quintOut}}" -->

<anchor
    in:fly={{ x: -70, duration: 600 }}
    out:fly={{ x: 70, duration: 300 }}
    {title}
    class="rounded-full"
    style="
        transform: scale({(weightVisits / 1000 + 1).toFixed(2)});
        margin: 5px {weightVisits / 100 + 10}px;
        z-index: -{weightVisits};
        "
    class:isBookmark
>
    <slot />
    <a href={url}>
        <anchoricon
            style="
        background-image: url('{src}');
        "
        />
        <!-- <svg viewBox="0 0 100 100" width="100" height="100">
            <title>{title}</title>
            <defs>
                <circle
                    id="circle"
                    cx="50"
                    cy="50"
                    r="49"
                    vector-effect="non-scaling-stroke"
                />
                <clipPath id="circle-clip">
                    <use xlink:href="#circle" />
                </clipPath> -->
        <!-- <filter id="f1" x="0" y="0">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                    </filter> -->
        <!-- </defs>
            <g clip-path="url(#circle-clip)"> -->
        <!-- <image
                        xlink:href={src}
                        filter="url(#f1)"
                        width="100%"
                        height="100%"
                    /> -->
        <!-- <use
                    xlink:href="#circle"
                    fill="none"
                    stroke="#ffffff"
                    stroke-width="0"
                    opacity="1"
                />
                <image
                    xlink:href={src}
                    x="25%"
                    y="25%"
                    width="50%"
                    height="50%"
                    preserveAspectRatio="xMidYMid slice"
                />
            </g>
        </svg> -->
        <!-- <img
            {src}
            width="50px"
            height="50px"
            alt={host.slice(0, 1).toUpperCase()}
        /> -->
        <span
            ><strong>{title}</strong> | {isBookmark
                ? "⭐"
                : visitCount + " visits"}</span
        >
    </a>
</anchor>

<!-- {/if} -->
<style lang="postcss">
    anchor {
        /* float: left; */
        /* border-radius: 50%; */
        /* max-width: 300px; */
        /* clear: both; */
        /* padding: 2%; */
        /* display: inline-flex; */
        /* justify-content: center; */
        /* align-items: center; */
        /* background-color: #fff9;
        background-color: rgba(255, 255, 255, 0.5); */
        /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px); */
        /* background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        transition: all 0.3s ease; */
        /* width: 30px;
        height: 30px;
        border-radius: 50px;
        margin: 2px;
        background-color: #fff;
        border: 10px solid transparent;
        text-overflow: ellipsis;
        overflow: hidden;
        display: inline-block;
        position: relative;
        padding-right: 0px;
        animation: -global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    }
    /* anchor::nth-child(2n) {
        float: right;
        margin-left: 20px;
    } */
    anchor.isBookmark {
        /* background-color: rgb(255, 242, 166); */
        background-color: #4c4e46;
    }
    /* blur { */
    /* filter: blur(10px); */
    /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        width: 100%;
        height: 100%;
        position: absolute;
        
        background-color: #fff9;
        background-color: rgba(255, 255, 255, 0.5); */
    /* -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px); */
    /* background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
        transition: all 0.3s ease; */
    /* } */

    anchor a {
        color: rgb(221, 221, 221);
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
    anchor a span {
        display: block;
        width: 0px;
        overflow: hidden;
        opacity: 0;

        /* transition: width 0.3s ease; */
        /* animation: width-grow 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    }

    .titleVisible anchor a span {
        display: block;
        min-width: 100px;
        width: auto;
        opacity: 1;
        transition: width 0.3s ease, opacity 1s linear;
        /* animation: width-grow 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    }
    /* transition: width 0.3s ease; */

    @keyframes width-grow {
        0% {
            width: 0px;
        }
        100% {
            width: auto;
        }
    }

    /* anchor:hover blur { */
    /* -webkit-animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    /* } */

    anchor:hover a {
        opacity: 1;
        /* position: relative; */
    }
    svg {
        height: 40px;
        width: 40px;
    }
    anchoricon {
        height: 18px;
        width: 18px;
        margin: 6px;
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
    }
    /* .img-blur { */
    /* filter: blur(10px); */
    /* -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px); */
    /* width: 100%; */
    /* height: 100%; */
    /* position: absolute; */
    /* } */
    /* .img-icon {
        z-index: 10;
    } */
    /* 
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
    } */
</style>
