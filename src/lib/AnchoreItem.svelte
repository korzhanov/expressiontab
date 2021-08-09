<script lang="ts">
    import { onMount, onDestroy, tick, getContext, hasContext } from "svelte";
    import Icon, {
        Star,
        Trash,
        Pencil,
        Duplicate,
        ClipboardCopy
    } from "svelte-hero-icons";
    // import {
    //     persist,
    //     indexedDBStorage
    //     // ,localStorage
    // } from "@macfja/svelte-persistent-store";
    // import { writable } from "svelte/store";
    // import TailwindCSS from "./TailwindCSS.svelte";
    import { fly, scale, slide } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    let now = new Date();
    export let dateAdded: number = now.getTime();
    export let dateGroupModified: number = now.getTime();
    export let lastVisitTime: number = now.getTime();
    export let id: number = 0;
    export let unfold: boolean | null = null;
    export let index: number = 0;
    // export let typedCount: number = 0;
    // export let parentId: number | null = null;
    // export let isBookmark: boolean = !!parentId;
    export let isBookmark: boolean = false;
    export let visitCount: number = 1;
    export let hostVisitCount: any = 0;
    let multiButton: boolean = false;
    let maxVisits: number = localStorage.getItem("maxVisits") || 500;
    // if (hasContext('maxVisits')) {
    // 	maxVisits = Math.max(getContext('maxVisits'), maxVisits);
    // }
    // let weightVisits: number = Math.ceil(
    //     ((Math.max(hostVisitCount, visitCount)||maxVisits)));

    //     x = 50px
    // r =

    // visits<=10 = 40px = x0.8
    // visits<=20 = 50px = x1
    // visits>20 = 50px = x1
    // visits=  R*50px = xR
    // visits>=maxVisits = 300px = x3
    // maxVisits=300
    // visits=weight

    // let weight = maxVisits%300;

    // let weightVisits: number = Math.max(
    //     (Math.max(hostVisitCount, visitCount) * 3) / maxVisits,
    //     0.8
    // );
    // let weightVisits: number = Math.log10(
    //     Math.max(hostVisitCount, visitCount) * 1
    // );
    let weightVisits: number = Math.log10(
        Math.max(unfold ? visitCount : hostVisitCount, visitCount) * 1
    );
    // let tempVisits = JSON.parse(localStorage.getItem("tempVisits") || "[]");
    // tempVisits.push((Math.max(hostVisitCount, visitCount)));
    // localStorage.setItem("tempVisits", JSON.stringify(tempVisits));

    // console.log((Math.max(hostVisitCount, visitCount) * 3) / maxVisits);

    export let title: string = "";
    export let url: string = "";
    let ping: string = "";
    try {
        let tmping: URL = new URL(url);
        tmping.searchParams.append(
            "utm_network",
            "ExpressionTab_ChromeExtension"
        );
        ping = tmping;
    } catch (e) {
        console.log(url);
        console.log(e);
    }
    // console.log(url);
    // console.log(hostVisitCount);
    // console.log(
    //     `let weightVisits (${weightVisits}): number = Math.max(Math.max(hostVisitCount (${hostVisitCount}), visitCount (${visitCount}))*3/maxVisits (${maxVisits}), 0.8);`
    // );
    let ignoreUrl = [
        "chrome:",
        "chrome-extension:",
        "javascript:",
        "file:",
        "data:"
    ];
    export let host = "localhost";
    // try {
    //     host = new URL(url).host.split(":")[0] || "localhost";
    // } catch (e) {
    //     console.log("No favicon for url: ", url);
    // }
    
    // @todo если нет сохраненного фавикона 
    // показать сначала по прямой ссылке
    // в следующий раз можно показать и кэшированный
    let src: string =
        "https://s2.googleusercontent.com/s2/favicons?domain_url=" + host;
    let img_data: string = localStorage.getItem("favicon_" + host) || "";
    // let img_data = persist(writable(""), localStorage(), "favicon_" + host);

    // getBase64Image("favicon_" + host, src);
    // if ($img_data.length == 0) {
    if (img_data.length > 0) {
        src = img_data;
    }

    // function remove(todo) {
    // 	todos = todos.filter(t => t !== todo);
    // }

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
<!-- {@debug weightVisits}
{@debug maxVisits}
{@debug visitCount}
{@debug hostVisitCount} -->
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
    on:contextmenu|stopPropagation|preventDefault={() => (multiButton = true)}
    on:mouseleave|stopPropagation|preventDefault={() => (multiButton = false)}
>
    <bgcircle
        style="
        transform: scale({(weightVisits * 1 + 1).toFixed(2)});
        background-image: url('{src}')
"
    />
    <slot />
    <a {ping} href={url}>
        <anchoricon
            style="background-image: url('{src ||
                'https://favicon.yandex.net/favicon/' + url}');"
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
        <span>
            <strong>{title}</strong> | {isBookmark
                ? "⭐"
                : visitCount + " visits"}
        </span>
    </a>
    {#if multiButton}
        <div
            class:multiButton
            in:fly={{ x: 5, duration: 300 }}
            out:fly={{ x: 5, duration: 300 }}
            on:mouseenter|stopPropagation|preventDefault={() => {}}
        >
            <button class="fas fa-star" title="Bookmark">
                <Icon src={Star} solid size="22" />
            </button>
            <!-- {#if isBookmark}
                <button class="fas fa-comment" title="Edit">
                    <Icon src={Pencil} solid size="22" />
                </button>
            {/if} -->
            <button class="fas fa-share-alt" title="Copy url">
                <Icon src={Duplicate} solid size="22" />
            </button>
            <button class="fas fa-trash" title="Delete">
                <Icon src={Trash} solid size="22" />
            </button>
        </div>
    {/if}
</anchor>

<!-- {/if} -->
<style lang="scss">
    // anchor {
    //     /* float: left; */
    //     /* border-radius: 50%; */
    //     /* max-width: 300px; */
    //     /* clear: both; */
    //     /* padding: 2%; */
    //     /* display: inline-flex; */
    //     /* justify-content: center; */
    //     /* align-items: center; */
    //     /* background-color: #fff9;
    //     background-color: rgba(255, 255, 255, 0.5); */
    //     /* -webkit-backdrop-filter: blur(10px);
    //     backdrop-filter: blur(10px); */
    //     /* background-position: center center;
    //     background-repeat: no-repeat;
    //     background-size: cover;
    //     transition: all 0.3s ease; */
    //     /* width: 30px;
    //     height: 30px;
    //     border-radius: 50px;
    //     margin: 2px;
    //     background-color: #fff;
    //     border: 10px solid transparent;
    //     text-overflow: ellipsis;
    //     overflow: hidden;
    //     display: inline-block;
    //     position: relative;
    //     padding-right: 0px;
    //     animation: -global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    // }
    /* anchor::nth-child(2n) {
        float: right;
        margin-left: 20px;
    } */

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

    /* transition: width 0.3s ease; */

    @keyframes width-grow {
        0% {
            width: 0px;
        }
        100% {
            width: auto;
        }
    }

    anchor svg {
        height: 40px;
        width: 40px;
    }
    anchoricon {
        height: 18px;
        width: 18px;
        margin: 6px;
        transform: scale(1.2);
        background-repeat: no-repeat;
        background-position: center;
        border-radius: 2px;
        // box-shadow: 4px 0 8px 0px #98989870;
        background-size: contain;
    }
    anchoricon.subicon {
        position: absolute;
        position: absolute;
        /* left: 17px; */
        z-index: -1;
        opacity: 0.2;
        transform: scale(0.9) translate(16px, -8px);
        border-radius: 4px;
        /* filter: brightness(1.29); */
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

    @keyframes -global-width-grow-anchor {
        0% {
            width: 50px;
            /* display: inline-block; */
        }
        100% {
            width: auto;
            /* display: block; */
        }
    }
    /* body {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        grid-gap: 5rem;
        padding: 5rem;
        background: #f5f7fa; */

    anchor {
        --background: #ffffff;
        --text: black;
        position: relative;
        width: 50px;
        height: 50px;
        border-radius: 50px;
        margin: 2px;
        // background-color: rgb(31, 30, 30, 0.65);
        border: 10px solid transparent;
        text-overflow: ellipsis;
        display: block;
        position: relative;
        padding-right: 0px;
        box-sizing: border-box;
        animation: -global-width-grow-anchor 1s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        transition: all 0.6s ease;
        /* overflow: hidden; */
        /* background-color: #fff; */
        /* height: 12rem;
            box-shadow: 0 0 2rem -1rem rgba(0, 0, 0, 0.05); */

        & bgcircle {
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
            filter: blur(5px);
            box-shadow: 5px 5px 10px #222;
            // backdrop-filter: blur(10px);
        }
        &.isBookmark {
            /* background-color: rgb(255, 242, 166); */
            //         background-color: #0f0f0f77;
            //         border-width: 10px !important;
            // border-color: #f1b426d9;
            // border-style: outset;
            background-color: #484848;
            border-width: 7px !important;
            border-color: #353535;
            border-style: solid;
            padding: 3px;
        }
        .multiButton {
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
            button {
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
                // transition: 0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s;
                transition: left, top 0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s;
                box-shadow: 0 0 0rem -0.25rem var(--background);
                &:hover {
                    background: var(--text);
                    color: var(--background);
                    box-shadow: 0 0 1rem -0.25rem var(--background);
                }
                &:first-child:nth-last-child(1),
                &:first-child:nth-last-child(1) ~ * {
                    //If there is 1 child
                    &:nth-child(1) {
                        left: 25%;
                        top: 25%;
                    }
                }
                &:first-child:nth-last-child(2),
                &:first-child:nth-last-child(2) ~ * {
                    //If there are 2 children
                    &:nth-child(1) {
                        left: 37.5%;
                        top: 18.75%;
                    }
                    &:nth-child(2) {
                        left: 18.75%;
                        top: 37.5%;
                    }
                }
                &:first-child:nth-last-child(3),
                &:first-child:nth-last-child(3) ~ * {
                    //If there are 3 children
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
                &:first-child:nth-last-child(4), //If there are 4 children, if first child is also 4th item from bottom get self, and
                &:first-child:nth-last-child(4) ~ * {
                    //If there are 4 children, if first child is also 4th item from bottom get siblings
                    &:nth-child(1) {
                        left: 62.5%;
                        top: 18.75%;
                    }
                    &:nth-child(2) {
                        left: 37.5%;
                        top: 18.75%;
                    }
                    &:nth-child(3) {
                        left: 18.75%;
                        top: 37.5%;
                    }
                    &:nth-child(4) {
                        left: 18.75%;
                        top: 62.5%;
                    }
                }
            }
        }

        // anchor {
        //     // position: absolute;
        //     // width: 100%;
        //     // height: 100%;
        //     // border-radius: 1rem;
        //     // background: var(--background);
        //     // color: var(--text);
        // }

        &:hover .multiButton,
        .multiButton:focus-within {
            //Hover or a button inside is focused
            z-index: -1;

            width: 10rem;
            height: 10rem;
            opacity: 1;
        }
        a {
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
        &:hover a {
            opacity: 1;
            /* position: relative; */
        }

        // &:hover blur {
        //     -webkit-animation: flip-diagonal-1-fwd 0.4s
        //         cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        //     animation: flip-diagonal-1-fwd 0.4s
        //         cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        // }

        .titleVisible & a span {
            display: block;
            min-width: 100px;
            width: auto;
            opacity: 1;
            transition: width 0.6s ease, opacity 1s linear;
            /* animation: width-grow 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
        }
        a span {
            display: block;
            width: 0px;
            overflow: hidden;
            opacity: 0;

            /* transition: width 0.3s ease; */
            /* animation: width-grow 0.4s cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
        }
    }
    /* } */
</style>
