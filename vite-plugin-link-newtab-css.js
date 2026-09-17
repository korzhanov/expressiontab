import { readdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

/**
 * После сборки: подключает CSS newtab в index.html.
 * - development: ./main.<hash>.css (cache-bust)
 * - production: переименовывает в ./main.css
 *
 * Не кладём <link> в src HTML — vite-plugin-chrome-extension
 * пытается открыть его как исходный файл и падает с ENOENT.
 */
export function linkNewtabCss(isProduction) {
  return {
    name: "link-newtab-css",
    apply: "build",
    writeBundle(options) {
      const outDir = options.dir || join(process.cwd(), "builds/expressiontab");
      const newtabDir = join(outDir, "newtab");
      if (!existsSync(newtabDir)) return;

      const cssFiles = readdirSync(newtabDir).filter(
        (f) => f.startsWith("main") && f.endsWith(".css")
      );
      if (!cssFiles.length) {
        console.warn("[link-newtab-css] нет main*.css в newtab/ — emitCss включён?");
        return;
      }

      let href;
      if (isProduction) {
        const src = cssFiles.includes("main.css")
          ? "main.css"
          : cssFiles[0];
        if (src !== "main.css") {
          renameSync(join(newtabDir, src), join(newtabDir, "main.css"));
        }
        for (const f of readdirSync(newtabDir)) {
          if (f.startsWith("main") && f.endsWith(".css") && f !== "main.css") {
            unlinkSync(join(newtabDir, f));
          }
        }
        href = "./main.css";
      } else {
        const hashed = cssFiles.find((f) => /^main\.[a-f0-9]+\.css$/i.test(f));
        href = "./" + (hashed || cssFiles[0]);
      }

      const htmlPath = join(newtabDir, "index.html");
      let html = readFileSync(htmlPath, "utf8");
      html = html.replace(
        /<style>\s*@import\s*["'][^"']+\.css["']\s*;?\s*<\/style>/gi,
        ""
      );
      html = html.replace(
        /<link[^>]+href=["']\.\/main[^"']*\.css["'][^>]*>/gi,
        ""
      );
      const tag = `<link rel="stylesheet" href="${href}" />`;
      html = html.includes("</head>")
        ? html.replace("</head>", `${tag}</head>`)
        : tag + html;
      writeFileSync(htmlPath, html);
      console.log(`[link-newtab-css] ${href}`);
    },
  };
}
