import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromeExtension, simpleReloader } from "vite-plugin-chrome-extension";

const mode = "development"; // production // development
const isProduction = mode === 'production'; // boolean

// https://vitejs.dev/config/
export default defineConfig({
  mode: mode,
  optimizeDeps: {
    include: ["svelte-hero-icons"],
  },
  logLevel: isProduction ? "silent" : "info",
  // logLevel: "info",
  plugins: [
    svelte({
      emitCss: isProduction,
    }),
    chromeExtension(
      {
        verbose: true,
        dynamicImportWrapper: false,
        contentScriptWrapper: false,
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

    simpleReloader(),
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
    watch: {
      buildDelay: 2000,
      clearScreen: true,
      include: __dirname + "/src/**",
    },
    outDir: "builds/expressiontab",
  },
  sourcemap: 'inline',
  assetsInlineLimit: 0,
  minify: 'terser',
});
