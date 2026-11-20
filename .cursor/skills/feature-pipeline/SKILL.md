---
name: feature-pipeline
description: >-
  Runs the cross-project feature pipeline in fixed order: HTML/CSS wireframes,
  shadcn-svelte and @ui-sdk/svelte mockups, atomic-design sandbox on local
  /test (stripped from production), bun:test plus Playwright snapshots,
  {prefix}_ and {prefix}_test_ tables, Faker role users for e2e/smoke, then
  GitHub issues, PRs, project status, and MARKETING.md. Use when starting or
  continuing a feature, screen, app, or product in any repo (hrh, 100words,
  olegarch, new apps), or when the user mentions wireframes, mockups, atomic
  design, /test sandbox, table prefix, test users, storybook, or feature pipeline.
---

# Feature pipeline

Кросспроектный порядок для старта и продолжения фичи. Источники: 100words (`references/mockups`), hrh (`/test` explorer, `tableName`, `@faker-js/faker`, `@test.app`), olegarch (atomic catalog, вырезание `src/routes/test` из билда, Playwright-скрины).

Не перескакивать стадии. Если артефакт стадии уже есть и всё ещё описывает задачу — обновить его, не плодить второй. Продолжение фичи начинается с первой незакрытой стадии.

Смежные скиллы читать по стадии, не копировать сюда: `shadcn-svelte`, `svelte-atomic-generator`, `issues-before-work`, `git-pr-cascade`, `marketing-journal`.

## Префикс проекта

`{prefix}` — короткое имя репозитория: `[a-z][a-z0-9]{1,15}`. Цифра в начале запрещена (`100words` → `words`). Примеры: `hrh`, `olegarch`, `words`.

Если в репозитории уже есть другой аффикс таблиц (hrh: логическое имя + `test_{name}_hrh`), **новые таблицы в этом репо идут через существующий хелпер**. Схему `{prefix}_` / `{prefix}_test_` не смешивать с чужой в одной БД. Greenfield и репо без аффикса — только схема ниже.

## Чеклист

```text
- [ ] 0 Issue + проект + статус (до кода)
- [ ] 1 Wireframe HTML/CSS
- [ ] 2 Mockup (shadcn-svelte, @ui-sdk/svelte если есть в зависимостях)
- [ ] 3 Atomic: atom → molecule → organism → page + /test story + design guide
- [ ] 4 bun:test + Playwright snapshot; значимый diff не затирать молча
- [ ] 5 Таблицы {prefix}_* и зеркало {prefix}_test_* + роутинг по флагу
- [ ] 6 Faker-пользователи ролей, e2e/smoke без боевого OAuth
- [ ] 7 PR, комментарии, статус, MARKETING.md если пользователь это увидит
```

## 0. Трек до кода

До файлов фичи: issue (цель, ожидаемое поведение, контекст). Epic — родитель, фича — child. Найти открытый issue и дописать план комментарием, дубликат не создавать.

Сразу `gh project item-add` на проект владельца репо (скилл `git-pr-cascade`). Статус выставить по полям **этого** проекта (`gh project field-list`), не копировать id чужого борда. Рабочая шкала, если на борде есть аналоги: Backlog → Todo → In progress → In review → Done.

Ветка `NNN-short-slug` от dev-базы репо, не от `main`. PR в ту же базу, `Refs`/`Fixes #N`. Прямой коммит в `main` / `release/*` запрещён, пока пользователь явно не сказал иначе.

Шаблон issue и ретро: [reference.md](reference.md).

## 1. Wireframes

Только HTML + CSS. Без Svelte, Tailwind, шрифтов бренда и цвета продукта.

Путь: `references/mockups/<feature>/index.html`. Общий каркас: `references/mockups/wf.css` (если файла нет — завести по образцу 100words: системный шрифт, рамка 1.5px, dashed placeholder, сетка).

Один файл = сетка экранов-состояний (пусто, данные, ошибка, успех), не один «счастливый» макет. Подпись экрана — номер и имя состояния. Интерактив — нативный `<button>` и несколько строк JS, если без него не видно перехода.

Ширины тех же пресетов, что песочница: 375, 768, 1280. Проверять перенос, не пиксель-пёрфект.

## 2. Mockups

После утверждённого wireframe. Компоненты:

1. Если в `package.json` есть `@ui-sdk/svelte` — собирать экран из него.
2. Иначе `bun x shadcn-svelte@latest add …` в `$lib/components/ui`. Алиасы только из `tsconfig` (`$lib/…`). Скилл `shadcn-svelte`.
3. Не рисовать вторую кнопку/инпут, если примитив уже есть в ui-kit.

Макет живёт в `references/mockups/<feature>/` **или** во временной истории `/test/pages`, если репо уже на SvelteKit. Цвет и тема — токены проекта, не сырой hex.

## 3. Atomic design и `/test`

Уровни и пути (скилл `svelte-atomic-generator`):

| Уровень | Путь | Смысл |
| --- | --- | --- |
| atom | `src/lib/components/atoms/` | Один жест, без своих данных |
| molecule | `src/lib/components/molecules/` | Связка атомов, одна задача |
| organism | `src/lib/components/organisms/` | Блок экрана |
| page | маршрут приложения + story | Сборка организмов |

Имена файлов PascalCase. Пропсы типизированы. В начале файла короткий комментарий: что это и какие пропсы.

Песочница — локальный storybook, не прод:

- Маршруты: `/test`, `/test/design`, `/test/atoms`, `/test/molecules`, `/test/organisms`, `/test/pages`.
- Каталог историй — один модуль (hrh: `explorer/stories/*.ts`; olegarch: `atomicCatalog.ts`): `id`, `level`, `component`, пропсы.
- `/test/design` — гайд: do/don't по оболочке, типографике, цвету, формам, пустым состояниям. Тема канваса: `light` | `dark` | `checker`. Пресеты: Mobile 375×720, Tablet 768×1024, Laptop 1280×760, Full 100%×540. Темы и пресеты — данные, не зашитые классы в каждой истории.
- Гейт: `dev` пускает; production (`VERCEL_ENV=production` или `!dev && !PUBLIC_TESTS`) → 404. `X-Robots-Tag: noindex`.
- Прод-сборка **удаляет** маршрут: до `vite build` перенести `src/routes/test` в `.build-tmp/test-route-backup` (вне `src/routes`), после сборки вернуть. Образец: olegarch `www/scripts/test-route-build.ts`. Не оставлять бэкап внутри `src/routes`.

Новый компонент без истории в каталоге своего уровня не считается готовым.

## 4. Тесты и снимки

Рядом с компонентом — `bun:test`: рендер не обязателен, проверяются чистые функции, состояния, контракт пропсов. Моки через `mock` из `bun:test`.

Playwright снимает **кадр истории** в `/test`, не весь браузер:

- baseline: `tests/sandbox-visual.pw.ts-snapshots/` или рядом с e2e, имя `{level}--{id}.png`;
- анимации выключены; нестабильный кадр стабилизировать до снимка (olegarch: два одинаковых rect подряд);
- порог значимости: `maxDiffPixelRatio` > **0.01** (1% пикселей) — значимое изменение;
- значимый diff **падает** в CI и печатает предупреждение локально: путь истории, файл baseline, команда обновления. Агент не запускает `--update-snapshots`, пока человек не принял новый вид;
- фильтр прогона: уровень или список id, чтобы не гонять весь каталог на каждый чих.

Команды прогона брать из `package.json` репо (`sandbox:visual`, `test:e2e`). Не добавлять Vitest во frontend, где тесты на `bun:test`.

## 5. Таблицы

Каждая таблица приложения:

- рабочая: `{prefix}_{entity}` (`words_card`);
- тестовая: `{prefix}_test_{entity}` (`words_test_card`) — та же колоночная схема, другие строки.

Имя в SQL выбирает один хелпер с allowlist логических имён. Флаг `{PREFIX}_TEST_TABLES=1` (и `PUBLIC_{PREFIX}_TEST_TABLES=1`, если имя нужно в браузере) переключает все чтения/записи. Сырое имя таблицы из запроса пользователя в SQL не подставлять.

Зеркало изолировано: FK тестовой таблицы ссылаются только на `{prefix}_test_*`. На облаке запись в `{prefix}_*` без флага тестов запрещена (исключение — явный `{PREFIX}_ALLOW_PROD_WRITES=1` или localhost). На Vercel Production тестовый флаг не ставить.

Существующий репо: вызывать его `tableName` / `supabaseTable`, не заводить второй префикс. Каркас хелпера для greenfield — [reference.md](reference.md).

## 6. Тестовые пользователи

Даже без настроенного OAuth e2e и smoke должны входить.

- Пакет `@faker-js/faker`, `faker.seed(n)` стабильный на прогон.
- Почта только `*@test.app` (или `*@{prefix}.test`, если репо уже так пишет). Боевые домены не использовать.
- Сразу сид ролей продукта, не одна «админская» учётка. Минимум, если роли ещё не заданы: `guest` не пишется в БД; `member`; `admin`. hrh добавляет `user` и `recruiter`. Роли брать из схемы репо.
- Сид пишет **только** в `{prefix}_test_*` (или в test-аффикс репо).
- Вход в Playwright — готовая session-cookie / storageState из сида, не живой провайдер.
- Скрипт идемпотентен: повторный запуск обновляет тех же пользователей по email.

## 7. Учёт и маркетинг

По ходу работы:

- план и решения — комментарий в issue, не только в чат;
- PR body: `Refs`/`Fixes`, чеклист стадий этого пайплайна, child-ссылки если фича разрезала epic;
- смена статуса на борде при старте, ревью и закрытии;
- закрытие: комментарий «что изменилось / как проверить / риски».

Ретроспектива эпика читается с борда без diff: цель issue, статус, PR, дата закрытия, одна строка исхода. Шаблон — [reference.md](reference.md).

Если человек увидит изменение в продукте — запись в `MARKETING.md` по скиллу `marketing-journal` (польза, без путей и номеров PR). Внутренний рефактор без смены поведения в журнал не писать. Фактура issue («что было / что сделали / для поста») сжимается в строку журнала, не копируется целиком.

## Когда остановиться

Стадия считается сделанной, когда артефакт в репо и проверка из чеклиста зелёная. Не спрашивать разрешения перейти к следующей стадии. Остановиться, если нет доступа к GitHub/БД: записать, какой шаг заблокирован, и продолжить всё, что можно без него.
