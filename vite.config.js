import {
  resolve
} from "path";
import {
  defineConfig
} from 'vite';
import {
  svelte
} from '@sveltejs/vite-plugin-svelte';
import {
  chromeExtension
} from 'vite-plugin-chrome-extension';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({
      emitCss:false,
      // entryFileNames: `[name].[ext]`,
      // cssHash: true
    }),
    chromeExtension()
  ],
  css: {
    modules: {
      generateScopedName: "main.css"
    }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    // alias: [{ find: '@', replacement: '/src' }],
  },
  build: {
    cssCodeSplit: true,
    // assetsDir: 'assets',
    rollupOptions: {

      // input: 'src/manifest.json',
      input: {
        manifest: 'src/manifest.json',
        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
      output: {
        entryFileNames: `[name].[ext]`,
        assetFileNames: `[name].[ext]`,
        name: 'expressiontab',
        // css: 'src/assests/main.css',
        // newtab: 'src/newtab/index.html',
      },
    },
    outDir: 'builds/expressiontab',
  }
})