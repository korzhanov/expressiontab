// Mock Chrome APIs до App — иначе CursorBrowser падает на chrome.history.search
import { installChromeMockIfNeeded } from "../lib/chrome-mock";
installChromeMockIfNeeded();

// Self-hosted Lato (woff2) — Vite кладёт файлы в пакет расширения
import "./fonts.css";

import App from "./App.svelte";

const appEl = document.getElementById("app");
const app = new App({
  target: appEl || document.body,
});

export default app;
