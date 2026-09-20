// Mock Chrome APIs до App — иначе CursorBrowser падает на chrome.history.search
import { installChromeMockIfNeeded } from "../lib/chrome-mock";
installChromeMockIfNeeded();

import App from "./App.svelte";

const appEl = document.getElementById("app");
const app = new App({
  target: appEl || document.body,
});

export default app;
