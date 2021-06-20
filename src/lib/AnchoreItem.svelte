<script lang="ts"> 
    export let radius:number =20,
         href:string = "#";
// Чтобы получить значок для домена, используйте:
// https://s2.googleusercontent.com/s2/favicons?domain=www.stackoverflow.com

// Чтобы получить значок для URL-адреса, используйте:
// https://s2.googleusercontent.com/s2/favicons?domain_url=https://www.stackoverflow.com
</script>

<div class="anchor">
    <svg>
        <circle cx="0" cy="0" r={radius} style="fill:#cccccc" />
    </svg>
    <picture>
        <source srcset="../assets/svelte.png" media="(min-width: 600px)" />
        <img
            src="https://s2.googleusercontent.com/s2/favicons?domain_url={href}"
            alt="ico"
        />
    </picture>
    <a {href}>{href}</a>
</div>

<style lang="postcss">
    a {
        text-overflow: ellipsis;
    }

</style>
