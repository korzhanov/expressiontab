## Learned User Preferences

- Всегда отвечать на русском языке.
- Использовать `bun` вместо `node` / `npm` / `yarn` — предпочтительный рантайм и пакетный менеджер.
- Писать тесты с `bun:test`, Playwright; unit/integration/snapshot/E2E по мере необходимости.
- Не удалять комментарии в коде; комментировать каждую существенную строку на **русском** (код как книга) — правило `.cursor/rules/russian-line-comments.mdc`.
- Держать код кратким: меньше строк — лучше.
- Не останавливаться на полпути — задачи доводить до 100% завершения без запросов подтверждения.
- Использовать паттерн RORO (Receive Object, Return Object) в функциях, где уместно.
- GitHub flow: **issue → ветка → PR** (не коммитить напрямую в `main`); прогресс в issue/PR; дерево задач в PR — правила в `.cursor/rules/`.
- Project board: [users/korzhanov/projects/9](https://github.com/users/korzhanov/projects/9) — добавлять issue/PR после create (см. `issue-before-fix.mdc`).
- Репозиторий **публичный**: секреты только в GitHub Actions Secrets; PAT для triage — scope `project` (без `repo`); см. `.cursor/rules/public-repo-security.mdc`.
- В документации, issue/PR, комментариях и ответах агента **не упоминать** сторонние/внутренние репозитории и их имена — только ExpressionTab и публичные ссылки этого репо.

## Learned Workspace Facts

- **Проект**: ExpressionTab (`korzhanov/expressiontab`) — Chrome MV3 new-tab: history + bookmarks → группировка по host → виртуальный скролл (speed-dial).
- **Стек**: Svelte 3 + TypeScript + Vite 2, `vite-plugin-chrome-extension`, PostCSS/SCSS, `@macfja/svelte-persistent-store`, `svelte-virtual-scroll-list`.
- **Точка входа**: `src/newtab/main.js` → `App.svelte` → `Anchores.svelte` → `HostItems` / `HostItem` / `AnchoreItem`.
- **Данные**: `chrome.history.search` + `chrome.bookmarks.search` → `src/lib/bookmarks.ts` (`buildBookmarkIndex`, `makeChunks`) → stores `nodesList` / `filteredListSliced`.
- **Сборка**: `bun run build` / `yarn build` → артефакт в `builds/expressiontab`; локально: Chrome → Extensions → Load unpacked → эта папка; Options → Enable.
- **Dev**: предпочтительно `bun`; в README ещё упоминается `yarn` + nodemon full rebuild (можно заменить на vite HMR позже).
- **Тесты**: `bun test` (unit в `src/lib/*.test.ts`); E2E Playwright — при наличии конфига.
- **Protected base**: `main` / `master` — только через PR (`branch-pr-not-direct-commit.mdc`).
- **Имена веток**: `NNN-short-slug` (номер issue) или `fix/…` / `feat/…`.
