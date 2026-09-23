#!/usr/bin/env bun
/**
 * Сборка ZIP для Chrome Web Store из builds/expressiontab.
 * Исключает исходники, docs, CHROMEWEBSTORE.md, maps.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const buildDir = join(root, "builds", "expressiontab");
const outDir = join(root, "store-assets");

// Версия из src/manifest.json (источник правды для CWS)
const manifest = JSON.parse(
  readFileSync(join(root, "src", "manifest.json"), "utf8")
);
const version = manifest.version || "0.0.0";
const zipName = `expressiontab-v${version}.zip`;
const zipPath = join(outDir, zipName);

console.log("→ bun run build");
const build = spawnSync("bun", ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(join(buildDir, "manifest.json"))) {
  console.error("Build missing:", buildDir);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
if (existsSync(zipPath)) unlinkSync(zipPath);

// zip содержимого builds/expressiontab (пути относительно корня пакета)
console.log("→ zip", zipName);
const zip = spawnSync(
  "zip",
  ["-qr", zipPath, ".", "-x", "*.map", "-x", ".DS_Store"],
  { cwd: buildDir, stdio: "inherit", shell: false }
);
if (zip.status !== 0) {
  process.exit(zip.status ?? 1);
}

const size = Bun.file(zipPath).size;
console.log(`Packaged: ${zipPath} (${(size / 1024).toFixed(1)} KiB)`);
