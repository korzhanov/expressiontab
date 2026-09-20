#!/usr/bin/env bun
/**
 * Watch src/ → полный `vite build` в отдельном процессе.
 * `vite build --watch` ломается: vite-plugin-chrome-extension
 * удаляет rollupOptions.input.manifest и на rebuild не резолвит entry
 * → "You must supply options.input to rollup" (#1).
 */
import { watch } from "fs";
import { spawn } from "child_process";
import { join } from "path";

const root = join(import.meta.dir, "..");
const srcDir = join(root, "src");

let running = false;
let queued = false;
/** @type {ReturnType<typeof setTimeout> | null} */
let debounceTimer = null;

function runBuild() {
  if (running) {
    queued = true; // ещё один прогон после текущего
    return;
  }
  running = true;
  console.log("\n[dev] build…");
  const child = spawn("bun", ["x", "vite", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    running = false;
    if (queued) {
      queued = false;
      runBuild();
      return;
    }
    if (code === 0) {
      console.log("[dev] ok — watching src/");
    } else {
      console.error(`[dev] build exit ${code} — waiting for next change`);
    }
  });
}

function scheduleBuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runBuild, 250);
}

runBuild();
watch(srcDir, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  // игнор временных/служебных
  if (filename.endsWith("~") || filename.includes(".DS_Store")) return;
  scheduleBuild();
});
