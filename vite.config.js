import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromeExtension } from "vite-plugin-chrome-extension";

const mode = "development"; // production
const isProduction = mode === 'production'; // boolean

// https://vitejs.dev/config/
export default defineConfig({
  mode: mode,
  optimizeDeps: {
    include: ["svelte-hero-icons"],
  },
  plugins: [
    svelte({
      emitCss: isProduction,
      // entryFileNames: `[name].[ext]`,
      cssHash: isProduction,
    }),
    chromeExtension(),
  ],
  css: {
    modules: {
      generateScopedName: "main.css",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    // alias: [{ find: '@', replacement: '/src' }],
  },
  // minify: isProduction,
  // emptyOutDir: false,
  build: {
    cssCodeSplit: isProduction,
    minify: isProduction,
    // watch: {
    //   buildDelay: 1000,
    //   clearScreen: true,
    //   include: __dirname + "/src/**",
    // },
    // assetsDir: 'assets',
    rollupOptions: {
      // input: 'src/manifest.json',
      input: {
        manifest: resolve(__dirname, "src/manifest.json"),

        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
      output: {
        entryFileNames: `[name].[ext]`,
        assetFileNames: `[name].[ext]`,
        name: "expressiontab",
        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
    },
    outDir: "builds/expressiontab",
  }, 
  watch: {
    cssCodeSplit: isProduction,
    minify: isProduction,
    watch: {
      buildDelay: 3000,
      clearScreen: true,
      include: __dirname + "/src/**",
    },
    assetsDir: 'assets',
    rollupOptions: {
      // input: 'src/manifest.json',
      input: {
        manifest: resolve(__dirname, "src/manifest.json"),

        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
      output: {
        entryFileNames: `[name].[ext]`,
        assetFileNames: `[name].[ext]`,
        name: "expressiontab",
        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
    },
    outDir: "builds/expressiontab",
  },
});
