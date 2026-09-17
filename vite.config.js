import { resolve } from "path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromeExtension } from "vite-plugin-chrome-extension";
// simpleReloader — опционально для HMR unpacked; не подключаем в текущей сборке
import { createHtmlPlugin } from "vite-plugin-html";
import { linkNewtabCss } from "./vite-plugin-link-newtab-css.js";

const mode = "development"; // production // development
const isProduction = mode === "production";

// https://vitejs.dev/config/
export default defineConfig({
  mode: mode,
  logLevel: isProduction ? "silent" : "info",
  plugins: [
    svelte({
      // Отдельный CSS-файл (не CSS-in-JS) — быстрее на new-tab
      emitCss: true,
    }),
    createHtmlPlugin({
      inject: {},
    }),
    chromeExtension({}),
    // После chrome-extension: линк на main.css / main.<hash>.css в index.html
    linkNewtabCss(isProduction),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  emptyOutDir: false,
  cssCodeSplit: true,
  assetsDir: "assets",
  build: {
    rollupOptions: {
      input: {
        manifest: resolve(__dirname, "src/manifest.json"),
      },
      output: {
        name: "expressiontab",
        entryFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
      // eval из транзитивных deps — не шумим в билде
      onwarn(warning, warn) {
        if (warning.code === "EVAL") return;
        warn(warning);
      },
    },
    outDir: "builds/expressiontab",
    external: true,
    assetsInlineLimit: 0,
    minify: "terser",
  },
});
