<script lang="ts">
    import { fly } from 'svelte/transition';
    export let dateAdded: number = new Date();
    export let dateGroupModified: number = new Date();
    export let lastVisitTime: number = new Date();
    export let id: number = 0;
    export let index: number = 0;
    export let parentId: number = 0;
    export let visitCount: number = 0;
    export let typedCount: number = 0;
    export let title: string = "";
    export let url: string = "";
    // export let radius: number = 20;
    let ignoreUrl = [
        "chrome:",
        "chrome-extension:",
        "javascript:",
        "file:",
        "data:"
    ];
    let host = "localhost";
    try {
        host = new URL(url).host;
    } catch (e) {
        console.log("No favicon for url: ", url);
    }

    let img_data: string = localStorage.getItem("favicon_" + host)||"";
    let src: string =
        "https://s2.googleusercontent.com/s2/favicons?domain_url=" + host;
    if (img_data.length == 0) {
        let imgpromise = getBase64Image("favicon_" + host, src);
        // console.log(imgpromise.then());
    } else{
        src = img_data;
    }
    async function getBase64Image(key: string, imgScr: string) {
        var img = new Image();
        img.onload = function() {
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            let ctx: any = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            try {
                let dataURL = canvas.toDataURL("image/png");
                localStorage.setItem(key, dataURL);
                return dataURL;
            } catch (e) {
                console.log(e);
            }
        };
        try {
            img.src = imgScr;
        } catch (e) {
            console.log(e);
        }
        // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        // return dataURL;
    }
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
<!-- {@debug visitCount} -->
    <anchor  in:fly="{{ y: 70, duration: 600 }}"
        {title}
        class="rounded-full"
        style="
        transform: scale({visitCount/1000+0.8});
        "
    >
    
    <!-- width:{Math.min((visitCount || 1) + 20,150)}px; 
    height:{Math.min((visitCount || 1) + 20,150)}px; -->
        <!-- <anchor {title} class="w-{20*(visitCount||1)} h-{20*(visitCount||1)} rounded-full" > -->
        <!-- on:contextmenu|stopPropagation|preventDefault="{() => {
            adjusting = !adjusting;
            if (adjusting) selected = circle;
        }}" -->
        <!-- <img
            class="img-blur"
            {src}
        /> -->
        <!-- <blur style="background-image: url({src});"  /> -->
        <!-- <img class="img-icon" {src} alt={title} /> -->
        <a href={url}>
            <svg viewBox="0 0 100 100" width="100" height="100">
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
                    </clipPath>
                    <!-- <filter id="f1" x="0" y="0">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                    </filter> -->
                </defs>
                <g clip-path="url(#circle-clip)">
                    <!-- <image
                        xlink:href={src}
                        filter="url(#f1)"
                        width="100%"
                        height="100%"
                    /> -->
                    <use
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
            </svg>
            <!-- <picture> -->
            <!-- <source srcset="../assets/svelte.png" media="(min-width: 600px)" /> -->

            <!-- </picture> -->
            <!-- {title} -->
        </a>
    </anchor>
{/if}

<style lang="postcss">
    anchor {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        /* max-width: 300px; */
        /* clear: both; */
        /* padding: 2%; */
        margin:2px;
        float: left;
        background-color: #fff;
        border: 10px solid transparent;
        text-overflow: ellipsis;
        overflow: hidden;
        /* display: inline-block; */
        position: relative;
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
    }
    anchor::odd {
        float: right;
        margin-left: 20px;
    }
    blur {
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
    }

    anchor a {
        /* position: absolute;
        text-overflow: ellipsis;
        font-size: 10px;
        line-height: 12px;
        margin: auto;
        height: 100%;
        width: 100%;
        display: block;
        text-decoration: none;
        color: #555; */
        /* opacity: 0; */
    }

    anchor:hover blur {
        /* -webkit-animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
        animation: flip-diagonal-1-fwd 0.4s
            cubic-bezier(0.455, 0.03, 0.515, 0.955) both; */
    }

    anchor:hover a {
        opacity: 1;
        /* position: relative; */
    }
    svg {
        height: auto;
        /* max-width: 66vmin; */
        width: 100%;
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
