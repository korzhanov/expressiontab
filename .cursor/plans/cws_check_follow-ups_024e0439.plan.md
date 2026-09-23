---
name: CWS check follow-ups
overview: "Закрыть риски из chrome-extensions check: точная PRIVACY, self-host Lato, чистый listing copy, title, скрипт ZIP и обновлённый скриншот без mock-badge."
todos: []
isProject: false
---

# CWS follow-ups после check

Issue → ветка `NNN-cws-check-followups` → PR в `main` (как в `.cursor/rules/`).

## 1. PRIVACY.md — правда про сеть

Переписать [PRIVACY.md](PRIVACY.md): убрать «no … external API calls».

Фактическая модель:
- History / bookmarks / settings — только локально (`chrome.history`, `chrome.bookmarks`, `chrome.storage.local`); не продаём, не шлём на свои серверы.
- Опционально наружу (без PII пользователя): загрузка favicon/cover с хостов и CDN (`s2.googleusercontent.com`, origin сайта); обои по выбору пользователя (`wallpaper-sources.ts`: Peapix / Bing / Picsum).
- После бандла шрифтов — Google Fonts CDN не используется.

Синхронизировать блок Privacy в [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md) (Data Use + note про wallpaper/favicon fetches).

## 2. Self-host Lato (убрать remote CSS)

Сейчас в [src/newtab/index.html](src/newtab/index.html) грузится `fonts.googleapis.com`.

- Добавить `src/assets/fonts/lato-{300,400,700}.woff2` (скачать официальные woff2 Lato).
- `@font-face` в [src/newtab/App.svelte](src/newtab/App.svelte) (или локальный CSS в `index.html`) с `url('../assets/fonts/...')`.
- Удалить `preconnect` / `<link>` на Google Fonts из `index.html`.
- Title страницы: `Xpression Tab` → `Expression Tab`.

## 3. Listing copy + justification `<all_urls>`

В [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md):
- Detailed Description: убрать `loadBackgroundMeta`, путь `builds/expressiontab`; только user-facing шаги.
- Justification для `<all_urls>`: fetch favicon/cover/wallpaper с произвольных origin (не «чтобы history.search работал»).
- Review Notes: отметить follow-up #NNN выполненным после мержа предыдущих blockers.

## 4. Скрипт ZIP для CWS

Новый [scripts/package-cws.mjs](scripts/package-cws.mjs) + npm script в [package.json](package.json):
- `bun run build`, затем zip только содержимого `builds/expressiontab/` → `store-assets/expressiontab-v{version}.zip`
- Без `.git`, `node_modules`, `CHROMEWEBSTORE.md`, source maps.

## 5. Скриншот без Preview-badge

Переснять `store-assets/screenshot-1-newtab-1280x800.png` с preview (mock chrome) при скрытом `.previewBanner` / без badge, 1280×800, letterbox без искажений. Обновить статус в CHROMEWEBSTORE.md.

## Вне скоупа

Сужение `<all_urls>` в манифесте не делаем (нужен рефактор fetch-цепочек); только честная justification.