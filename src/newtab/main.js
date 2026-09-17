// Mock Chrome APIs до App — иначе CursorBrowser падает на chrome.history.search
import { installChromeMockIfNeeded } from "../lib/chrome-mock";
installChromeMockIfNeeded();

import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

export default app;
