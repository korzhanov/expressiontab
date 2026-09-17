#!/usr/bin/env bun
/**
 * bun install иногда кладёт vite-plugin-chrome-extension без lib/
 * (битый/неполный пакет). Проверяем и чиним через npm при необходимости.
 */
import { existsSync, rmSync } from "fs";
import { spawnSync } from "child_process";
import { join } from "path";

const root = join(import.meta.dir, "..");
const pkgDir = join(root, "node_modules/vite-plugin-chrome-extension");
const libEntry = join(pkgDir, "lib/index-cjs.js");

if (existsSync(libEntry)) {
  process.exit(0);
}

console.warn(
  "[ensure-deps] vite-plugin-chrome-extension без lib/ — переустанавливаю через npm…"
);

// Полностью убираем битый каталог, иначе npm --no-save может ничего не дописать
if (existsSync(pkgDir)) {
  rmSync(pkgDir, { recursive: true, force: true });
}

const r = spawnSync(
  "npm",
  [
    "install",
    "vite-plugin-chrome-extension@0.0.7",
    "--save-dev",
    "--no-fund",
    "--no-audit",
  ],
  { cwd: root, stdio: "inherit", shell: true }
);

if (r.status !== 0 || !existsSync(libEntry)) {
  console.error(
    "[ensure-deps] Не удалось восстановить vite-plugin-chrome-extension. Запусти: npm install vite-plugin-chrome-extension@0.0.7 --save-dev"
  );
  process.exit(1);
}
console.warn("[ensure-deps] OK");
