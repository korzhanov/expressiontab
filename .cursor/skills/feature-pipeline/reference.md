# Feature pipeline — шаблоны

Читать по стадии из [SKILL.md](SKILL.md). Подставить `{prefix}`, `{feature}`, `{entity}`.

## Issue

```markdown
## Цель
Что человек сможет сделать.

## Ожидание
Наблюдаемый результат.

## Контекст
Родительский epic #N, если есть. Стадия пайплайна, с которой стартуем.

## План
- [ ] 1 Wireframe
- [ ] 2 Mockup
- [ ] 3 Atomic + /test
- [ ] 4 Тесты и снимки
- [ ] 5 Таблицы
- [ ] 6 Тестовые пользователи
- [ ] 7 PR и журнал
```

Стадии без данных или UI вычёркивать в этом issue одной строкой «не требуется», не удалять молча.

## Ретро эпика

```markdown
## Ретро #N
- Исход: одна фраза, что стало возможным
- PR: #M
- Не вошло: …
- Повторить: что в процессе сработало
- Убрать: какой шаг был лишним
```

## Wireframe

`references/mockups/wf.css` — общие классы `.page .row .box .btn .ph .h1`. Экран фичи их использует, свои цвета не задаёт.

Каркас экрана:

```html
<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wireframe · {feature}</title>
<link rel="stylesheet" href="../wf.css">
<body>
<main class="page">
  <p class="lbl">01 · пусто</p>
  <h1 class="h1">…</h1>
  <div class="box">…</div>
</main>
```

Состояния класть рядом сеткой, как `references/mockups/artikel-wireframe.html` в 100words.

## История песочницы

Минимальный контракт каталога:

```ts
export type AtomicLevel = 'atoms' | 'molecules' | 'organisms' | 'pages'

export type Story = {
  id: string
  name: string
  level: AtomicLevel
  component: Component<any>
  props?: Record<string, unknown>
}
```

Пресеты канваса (hrh `Canvas.svelte`): Mobile 375×720, Tablet 768×1024, Laptop 1280×760, Full 100%×540. Фоны: `light`, `dark`, `checker`. Снимок Playwright — Laptop, тема по умолчанию продукта; отдельный снимок тёмной темы, если компонент красится от `data-theme`.

Гейт маршрута: production → 404; иначе dev или явный флаг. Заголовок `X-Robots-Tag: noindex, nofollow`.

Вырез из билда: `hideTestRoute()` переименовывает `src/routes/test` → `.build-tmp/test-route-backup` до сборки, `restoreTestRoute()` возвращает в `finally`.

## Снимок

```ts
await expect(frame).toHaveScreenshot(`${level}--${id}.png`, {
  animations: 'disabled',
  maxDiffPixelRatio: 0.01,
})
```

Выше порога — значимое изменение: в лог путь истории и файл baseline. Обновление baseline только отдельной командой по просьбе человека.

## Таблицы (greenfield)

```ts
export const TABLES = ['user', 'card'] as const
export type Table = (typeof TABLES)[number]

const ALLOWED = new Set<string>(TABLES)

export function tableName({ name, env }: { name: Table; env?: Record<string, string | undefined> }): string {
  if (!ALLOWED.has(name)) throw new Error(`Unknown table: ${name}`)
  const bag = env ?? process.env
  const test = bag.WORDS_TEST_TABLES === '1' || bag.PUBLIC_WORDS_TEST_TABLES === '1'
  return test ? `words_test_${name}` : `words_${name}`
}
```

`WORDS_` заменить на `{PREFIX}_` в верхнем регистре. DDL зеркала повторяет рабочую таблицу; внешние ключи указывают на зеркало. Облачная запись в `words_*` при выключенном тестовом флаге — throw, кроме localhost и явного `WORDS_ALLOW_PROD_WRITES=1`.

Репо с готовым хелпером (hrh `frontend/src/lib/db/table-names.ts`): не вводить `hrh_` рядом с `test_*_hrh`.

## Пользователи

```ts
import { faker } from '@faker-js/faker'

faker.seed(100)

const roles = ['member', 'admin'] as const

for (const role of roles) {
  const email = `${role}@test.app`
  // upsert только в tableName({ name: 'user' }) при тестовом флаге
}
```

Плюс записи сессии с известным token для storageState Playwright. Повтор сида не создаёт вторую строку с тем же email.

## PR

```markdown
## Summary
- …

## Pipeline
- [x] wireframe references/mockups/{feature}
- [x] /test story
- [ ] таблицы — не требовались

Refs #N
```

## Журнал

Формат и запрет жаргона — скилл `marketing-journal`. Версия и дата совпадают с релизом продукта. Строка пишется, когда сценарий уже работает.
