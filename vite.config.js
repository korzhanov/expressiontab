import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromeExtension, simpleReloader } from "vite-plugin-chrome-extension";
import { createHtmlPlugin } from 'vite-plugin-html';

const mode = "development"; // production // development
const isProduction = mode === 'production'; // boolean

// https://vitejs.dev/config/
export default defineConfig({
  mode: mode,
  // optimizeDeps: {
  //   include: ["svelte-hero-icons"],
  // },
  logLevel: isProduction ? "silent" : "info",
  // logLevel: "info",
  plugins: [
    svelte({
      // emitCss: isProduction,
      emitCss: true,
    }),
    createHtmlPlugin({
      // minify: true,
      // pages : [ 
      //   {
      // entry: "src/newtab/index.js",
      // template: "src/newtab/index.html",
      inject: {
        // data: {
        //   injectStylesheet: `<link rel="stylesheet" type="text/css" href="main.css" />`,
        //   injectScript: `<script type="module" src="main.js"></script>`,
        // },
        // tags: [
        //   {
        //     injectTo: 'head',
        //     tag: 'link',
        //     attrs: {
        //       href: 'main.css',
        //       rel: "stylesheet",
        //       type: "text/css"
        //     },
        //   },
        //   {
        //     injectTo: 'body',
        //     tag: 'script',
        //     attrs: {
        //       src: 'main.js',
        //       type: "module"
        //     },
        //   },
        // ],
      },
      // }],
    }),
    chromeExtension(
      {
        // verbose: true,
        // dynamicImportWrapper: true,
        // contentScriptWrapper: false,
      }
    ),
    // {
    //   name: 'disable-treeshake',
    //   transform(code, id) {
    //     if (id.endsWith('.html')) {
    //       console.log(id);
    //       return { moduleSideEffects: 'no-treeshake' };
    //     }
    //   },
    // },

    // simpleReloader(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  emptyOutDir: false,
  cssCodeSplit: true,
  assetsDir: 'assets',
  build: {
    rollupOptions: {
      input: {
        manifest: resolve(__dirname, "src/manifest.json"),
      },
      output: {
        name: "expressiontab",
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      },
    },
    // watch: {
    //   buildDelay: 1000,
    //   chokidar: true,
    //   clearScreen: false,
    //   include: resolve(__dirname + "/src/**"),
    //   skipWrite: true,
    // },
    outDir: "builds/expressiontab",
    external: true,
    // sourcemap: 'inline',
    assetsInlineLimit: 0,
    minify: 'terser',
  },
});
