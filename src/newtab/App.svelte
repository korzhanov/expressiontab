<script lang="ts">
  import { onMount } from "svelte";
  import { slimscroll } from "svelte-slimscroll";
  import { fade } from "svelte/transition";
  import logo from "../assets/svelte.png";
  import firstbg from "../assets/expression-drops-xfactorial-com-copyright.jpg";
  import "../lib/TailwindCSS.svelte";
  // import css from "../assets/main.css";
  import Anchores from "../lib/Anchores.svelte";
  // import Counter from "../lib/Counter.svelte";
  import Timer from "../lib/Timer.svelte";
  // import chrome from vite-plugin-chrome-extension;

  //   chrome.scripting.insertCSS({
  //   // target: { tabId: tab.id },
  //   files: ["assets/main.css"]
  // });
  let imgsrc: string =
    "https://source.unsplash.com/random/1600x900/?mountains,water,cloud,night";
  let background = localStorage.getItem("background");
  // let background = new Image();
  // background.src = imgsrc;

  onMount(() => {
    // getBase64Image("background",imgsrc);
  });
  async function getBase64Image(key: string, imgScr: string) {
    performance.mark("start_img");

    var img = new Image();
    img.onload = function() {
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx: any = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        let dataURL = canvas.toDataURL("image/jpg");
        localStorage.setItem(key, dataURL);
        performance.mark("end_img");
        performance.measure(
          "img saved to localStorage",
          "start_img",
          "end_img"
        );

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
  }
</script>

<main
  in:fade
  out:fade
  use:slimscroll={{
    height: "100vh",
    width: "100vw",
    alwaysVisible: false,
    disableFadeOut: false,
    color: "grey"
  }}
>
  <!-- <img src={logo} alt="Svelte Logo" /> -->

  <bg
    in:fade
    out:fade
    style="background-image: 
  url('{firstbg}')
  ;"
  />
  <!-- <bg 
  in:fade
  out:fade
  style="background-image: 
  url('{localImgSrc||imgsrc}')
  ;"
  /> -->
  <!-- {@debug background} -->
  <!-- {#await background then b}
  {@debug background} -->
  <bg
    in:fade
    out:fade
    style="background-image: 
  url('{imgsrc}')
  ;"
  />
  <!-- {/await} -->
  <!-- <img src={imgsrc} alt=""> -->
  <overlay />
  <spacer>
    <Timer />
    <!-- <Counter /> -->
  </spacer>
  <Anchores />
</main>

<style lang="postcss">
  * {
    --brand-color: rgba(255, 255, 255, 1);
  }
  :root {
    font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  /* custom scrollbar */
  /* ::scrollbar,::-webkit-scrollbar :global(body) {
  width: 20px;
}

::scrollbar-track,::-webkit-scrollbar-track :global(body) {
  background-color: transparent;
}

::scrollbar-thumb,::-webkit-scrollbar-thumb :global(body) {
  background-color: #d6dee1;
  border-radius: 20px;
  border: 6px solid transparent;
  background-clip: content-box;
}

::scrollbar-thumb:hover, ::-webkit-scrollbar-thumb:hover :global(body) {
  background-color: #a8bbbf;
} */
  /* end custom scrollbar */
  main {
    text-align: center;
    margin: 0 auto;
    /* padding: 1vh; */
    min-height: 100vh;
    transition: all 0.5s ease;
    /* background: #222;     */
    font-weight: 300;
    /* background-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.25) 0,
        rgba(0, 0, 0, 0.25)
      ),
      url("https://source.unsplash.com/random/?mountains,expression,lake,cloud,night,city"); */
  }
  /* main:hover spacer { */

  spacer {
    background: linear-gradient(
      180deg,
      rgba(20, 20, 20, 0),
      rgba(20, 20, 20, 1)
    );
    height: 92vh;
    transition: height 0.3s ease-in-out 1s;
    display: flex;
    width: 100%;
    position: relative;
    flex-direction: row;
    flex-wrap: nowrap;
    align-content: space-around;
    justify-content: space-around;
    align-items: center;
  }
  spacer:hover {
    height: 87vh;
    transition: height 0.6s ease-in-out 1s;
  }

  /* anchores:hover+spacer, filterbar:hover+spacer {
    height: 30vh;
    transition: height 0.6s ease-in-out 1s;
  } */

  /* img {
    height: 16rem;
    width: 16rem;
  } */

  bg {
    /* background-image: url("../assets/expression-drops-xfactorial-com-copyright.jpg") */
    /* ,url("./assets/expression-drops-xfactorial-com-copyright.jpg") */
    /* ,url("../assets/expression-drops-xfactorial-com-copyright.jpg") */
    /*, url("https://source.unsplash.com/random/1600x900/?mountains,water,cloud,night"); */
    /* ,expression,city */
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    min-height: 100vh;
    z-index: -2;
  }

  overlay {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    overflow: hidden;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.25) 0,
      rgba(0, 0, 0, 0.25)
    );
    z-index: -1;
  }
  /* html {
    line-height: 1.15;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    height: 100%;
  }
  body {
    margin: 0;
  }
  article,
  aside,
  footer,
  header,
  nav,
  section {
    display: block;
  }
  h1 {
    font-size: 2em;
    margin: 0.67em 0;
  }
  figcaption,
  figure,
  main {
    display: block;
  }
  figure {
    margin: 1em 40px;
  }
  hr {
    box-sizing: content-box;
    height: 0;
    overflow: visible;
  }
  pre {
    font-family: monospace, monospace;
    font-size: 1em;
  }
  a {
    background-color: transparent;
    -webkit-text-decoration-skip: objects;
  }
  abbr[title] {
    border-bottom: none;
    text-decoration: underline;
    text-decoration: underline dotted;
  }
  b,
  strong {
    font-weight: inherit;
    font-weight: bolder;
  }
  code,
  kbd,
  samp {
    font-family: monospace, monospace;
    font-size: 1em;
  }
  dfn {
    font-style: italic;
  }
  mark {
    background-color: #ff0;
    color: #000;
  }
  small {
    font-size: 80%;
  }
  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }
  sub {
    bottom: -0.25em;
  }
  sup {
    top: -0.5em;
  }
  audio,
  video {
    display: inline-block;
  }
  audio:not([controls]) {
    display: none;
    height: 0;
  }
  img {
    border-style: none;
  }
  svg:not(:root) {
    overflow: hidden;
  }
  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: sans-serif;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }
  button,
  input {
    overflow: visible;
  }
  button,
  select {
    text-transform: none;
  }
  [type="reset"],
  [type="submit"],
  button,
  html [type="button"] {
    -webkit-appearance: button;
  }
  [type="button"]::-moz-focus-inner,
  [type="reset"]::-moz-focus-inner,
  [type="submit"]::-moz-focus-inner,
  button::-moz-focus-inner {
    border-style: none;
    padding: 0;
  }
  [type="button"]:-moz-focusring,
  [type="reset"]:-moz-focusring,
  [type="submit"]:-moz-focusring,
  button:-moz-focusring {
    outline: 1px dotted ButtonText;
  }
  fieldset {
    padding: 0.35em 0.75em 0.625em;
  }
  legend {
    box-sizing: border-box;
    color: inherit;
    display: table;
    max-width: 100%;
    padding: 0;
    white-space: normal;
  }
  progress {
    display: inline-block;
    vertical-align: baseline;
  }
  textarea {
    overflow: auto;
  }
  [type="checkbox"],
  [type="radio"] {
    box-sizing: border-box;
    padding: 0;
  }
  [type="number"]::-webkit-inner-spin-button,
  [type="number"]::-webkit-outer-spin-button {
    height: auto;
  }
  [type="search"] {
    -webkit-appearance: textfield;
    outline-offset: -2px;
  }
  [type="search"]::-webkit-search-cancel-button,
  [type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  ::-webkit-file-upload-button {
    -webkit-appearance: button;
    font: inherit;
  }
  details,
  menu {
    display: block;
  }
  summary {
    display: list-item;
  }
  canvas {
    display: inline-block;
  }
  [hidden],
  template {
    display: none;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: Lato, sans-serif;
    font-size: 100% !important;
  }

  @media (min-width: 480px) {
    h1 {
      max-width: none;
    }

    p {
      max-width: none;
    }
  } */
</style>
