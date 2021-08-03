<script lang="ts">
    import { setContext, getContext, hasContext } from "svelte";
    import AnchoreItem from "./AnchoreItem.svelte";
    import { longhover } from "./longhover";
    export let hostItem: any;
    let domain = hostItem[0];
    let anchores = hostItem[1];
    let hostAnchore = anchores[0];
    let otherAnchores = anchores.slice(1);
    let tweenOtherAnchores: Array<any> = [];
    let unfold = false;

    $: if (unfold == true) {
        tweenOtherAnchores = [];
        otherAnchores.forEach((newItem: any, i: number) => {
            // anchores.forEach((newItem: any, i: number) => {
            setTimeout(function() {
                // console.log("newItem");
                // console.log(newItem);
                // tweenOtherAnchores = [...tweenOtherAnchores, newItem];
                tweenOtherAnchores[i] = newItem;
            }, 150);
        });
    }

    // let maxVisits = hostAnchore.hostVisitCount;
    // if (hasContext('maxVisits')) {
    // 	maxVisits = Math.max(getContext('maxVisits'), maxVisits);
    // }
    // setContext('maxVisits', maxVisits);
    let host: string = "localhost";
    try {
        host = new URL(hostAnchore.url).host.split(":")[0];
        setTimeout(function() {
            let fav = localStorage.getItem("favicon_" + host);
            if (!fav?.length) {
                toDataURL(
                    "https://s2.googleusercontent.com/s2/favicons?domain_url=" +
                        host,
                    // "https://favicon.yandex.net/favicon/" +host,
                    function(dataUrl: any) {
                        localStorage.setItem("favicon_" + host, dataUrl);
                        console.log("new favicon saved from ", host);
                    }
                );
            }
        }, 10000);
    } catch (e) {
        console.log("No favicon for url: ", hostAnchore.url, hostAnchore.title);
    }

    async function toDataURL(urll: string, callback: any) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open("GET", urll);
        xhr.responseType = "blob";
        xhr.send();
    }
</script>

{#if anchores.length < 5}
    <!-- {#each anchores as item (item)} -->
    {#each anchores as item}
        <AnchoreItem {...item} {host} />
    {/each}
{:else}
    {#if unfold}
    <anchorGroup
        class="hovicon effect-8"
        use:longhover={2000}
        on:longhover={() => (unfold = !unfold)}
        class:unfold
    >
        <!-- 
        on:mouseover={() => (multiButton = true)}
        on:mouseleave={() => (multiButton = false)} -->
        <!-- {@debug hostAnchore} -->
        <AnchoreItem {...hostAnchore} {host} unfold={unfold} />
    </anchorGroup>
        {#each tweenOtherAnchores as item (item)}
            <!-- {#each otherAnchores as item} -->
            <AnchoreItem {...item} {host} />
        {/each}
        {:else}
        
    <anchorGroup
    class="hovicon effect-8"
    use:longhover={2000}
    on:longhover={() => (unfold = !unfold)}
    class:unfold
>
    <!-- 
    on:mouseover={() => (multiButton = true)}
    on:mouseleave={() => (multiButton = false)} -->
    <!-- {@debug hostAnchore} -->
    <AnchoreItem {...hostAnchore} {host} unfold={unfold} />
</anchorGroup>
    {/if}

{/if}

<style lang="scss">
    anchorGroup {
        /* display: block; */
        /* position: absolute; */
        // width: 100%;
        // height: 100%;
        width: 50px;
        height: 50px;
        display: flex;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
        align-items: baseline;
        flex-direction: row;
        // border: 1px solid rgb(43, 43, 43) !important;
        border: 1px solid transparent !important;
        border-radius: 50%;
        margin: 30px;
    }
    anchorGroup:hover {
        transition: all 1s ease;
        border: 1px dashed rgb(58, 42, 42) !important;
    }

    .hovicon {
        // display: inline-block;
        // font-size: 45px;
        // line-height: 90px;
        cursor: pointer;
        // margin: 20px;
        // width: 90px;
        // height: 90px;
        // border-radius: 50%;
        // text-align: center;
        // position: relative;
        // text-decoration: none;
        // z-index: 1;
        // color: #fff;
    }
    // .hovicon.auto-width {
    //     width: auto;
    //     height: auto;
    //     padding: 15px;
    // }
    .hovicon:after {
        pointer-events: none;
        position: absolute;
        // width: 100%;
        // height: 100%;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        content: "";
        -webkit-box-sizing: content-box;
        -moz-box-sizing: content-box;
        box-sizing: content-box;
    }
    .hovicon:before {
        speak: none;
        // font-size: 48px;
        // line-height: 90px;
        // font-style: normal;
        // font-weight: normal;
        // font-variant: normal;
        // text-transform: none;
        display: block;
        -webkit-font-smoothing: antialiased;
    }
    /* Effect 8 */
    .hovicon.effect-8 {
        /*     background: rgba(255, 255, 255, 0.1); */
        -webkit-transition: -webkit-transform ease-out 0.1s, background;
        -moz-transition: -moz-transform ease-out 0.1s, background;
        transition: transform ease-out 0.1s, background;
    }
    .hovicon.effect-8:after {
        top: 0;
        left: 0;
        // padding: 0;
        z-index: -1;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
        opacity: 0;
        -webkit-transform: scale(0.9);
        -moz-transform: scale(0.9);
        -ms-transform: scale(0.9);
        transform: scale(0.9);
    }
    .hovicon.effect-8:hover {
        /*     background: rgba(255, 255, 255, 0.05); */
        -webkit-transform: scale(0.93);
        -moz-transform: scale(0.93);
        -ms-transform: scale(0.93);
        transform: scale(0.93);
        /*     color: #fff; */
    }
    .hovicon.effect-8:hover i {
        /*     color: #fff; */
    }
    .hovicon.effect-8:hover:after {
        // -webkit-animation: sonarEffect 1.3s ease-out 1075ms;
        // -moz-animation: sonarEffect 1.3s ease-out 1075ms;
        animation: sonarEffect 0.7s ease-out;
        animation-iteration-count: 3;
    }
    .unfold.hovicon.effect-8:hover:after {
        // -webkit-animation: sonarEffect 1.3s ease-out 2075ms reverse ;
        // -moz-animation: sonarEffect 1.3s ease-out 2075ms reverse ;
        animation: sonarEffect 2s ease-out 1775ms reverse;
        animation-iteration-count: 3;
   
    }
    @-webkit-keyframes sonarEffect {
        0% {
            opacity: 0.3;
        }
        40% {
            opacity: 0.5;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
                0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
        }
        100% {
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
                0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
            transform: scale(5);
            opacity: 0;
        }
    }
    // @-moz-keyframes sonarEffect {
    //     0% {
    //         opacity: 0.3;
    //     }
    //     40% {
    //         opacity: 0.5;
    //         box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
    //             0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
    //     }
    //     100% {
    //         box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
    //             0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
    //         -moz-transform: scale(1.5);
    //         opacity: 0;
    //     }
    // }
    // @keyframes sonarEffect {
    //     0% {
    //         opacity: 0.3;
    //     }
    //     40% {
    //         opacity: 0.5;
    //         box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
    //             0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
    //     }
    //     100% {
    //         box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1),
    //             0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);
    //         transform: scale(1.5);
    //         opacity: 0;
    //     }
    // }
</style>
