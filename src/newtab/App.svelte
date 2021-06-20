<script lang="ts">
  import logo from "../assets/svelte.png";
  import '../lib/TailwindCSS.svelte'
  // import css from "../assets/main.css";
  import Anchores from "../lib/Anchores.svelte";
  import Counter from "../lib/Counter.svelte";
  import Timer from "../lib/Timer.svelte";
// import chrome from vite-plugin-chrome-extension;

//   chrome.scripting.insertCSS({
//   // target: { tabId: tab.id },
//   files: ["assets/main.css"]
// });
</script>

<main>
  <!-- <img src={logo} alt="Svelte Logo" /> -->
 
  <Timer />
  <Counter />
  <Anchores />
</main>

<style lang="postcss">
  :root {
    font-family: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    padding: 1vh;
    margin: 0 auto;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    background-image: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.25) 0,
        rgba(0, 0, 0, 0.25)
      ),
      url("https://source.unsplash.com/random/?mountains,expression,lake,cloud,night,city");
    min-height: 100vh;
    transition: all 0.5s ease;
  }

  img {
    height: 16rem;
    width: 16rem;
  }
  html {
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
  }
</style>
