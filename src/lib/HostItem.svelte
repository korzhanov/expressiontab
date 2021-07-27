<script lang="ts">
    import { setContext, getContext, hasContext } from "svelte";

    import AnchoreItem from "./AnchoreItem.svelte";
    import { longhover } from "./longhover";
    export let hostItem: any;
    let domain = hostItem[0];
    let anchores = hostItem[1];
    let hostAnchore = anchores[0];
    let otherAnchores = anchores.slice(1);
    let view = false;
    let maxVisits = hostAnchore.hostVisitCount;
    if (hasContext('maxVisits')) {
		maxVisits = Math.max(getContext('maxVisits'), maxVisits);
	}
    setContext('maxVisits', maxVisits);

    try {
       let host = new URL(hostAnchore.url).host.split(":")[0] || "localhost";
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
        <AnchoreItem {...item} />
    {/each}
{:else}
    <anchorGroup use:longhover on:longhover={() => (view = !view)}>
        <AnchoreItem {...hostAnchore} />
    </anchorGroup>
    {#if view}
        {#each otherAnchores as item (item)}
        <!-- {#each otherAnchores as item} -->
            <AnchoreItem {...item} />
        {/each}
    {/if}
{/if}

<style>
    anchorGroup {
        /* display: block; */
        /* position: absolute; */
        /* width: 100%;
        height: 100%; */
        display: flex;
        flex-wrap: wrap;
        align-content: center;
        justify-content: center;
        align-items: baseline;
        flex-direction: row;
        border: 1px dashed transparent !important;
        border-radius: 50px;
    }
    anchorGroup:hover {
        transition: all 1s ease;
        border: 5px dashed rgb(58, 42, 42) !important;
    }
</style>
