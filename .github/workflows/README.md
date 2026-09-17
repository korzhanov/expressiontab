## GitHub Projects v2 auto-triage

Workflow [`project-auto-triage.yml`](./project-auto-triage.yml) автоматически:

- добавляет новый PR/issue в проект [users/korzhanov/projects/9](https://github.com/users/korzhanov/projects/9)
- назначает автора PR/issue как assignee
- по `workflow_dispatch` может забэкфиллить все открытые PR/issues

### Важно: workflow должен быть на base-ветке PR

`pull_request_target` читает workflow с **base** ветки (часто `main`). Файл обязан существовать там, иначе автодобавление не сработает.

### Требуемый секрет (публичный репо)

`GITHUB_TOKEN` **не** имеет доступа к user-owned Projects v2.

В репозитории → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|------|--------|
| `PROJECT_TOKEN` | Classic PAT **только** со scope **`project`** |

Репо **публичный** — scope `repo` **не** нужен. Не коммитить PAT в git / issue / PR. Полные правила: [`.cursor/rules/public-repo-security.mdc`](../../.cursor/rules/public-repo-security.mdc).

Создание PAT: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → отметить **только** `project`.

### После настройки

1. Убедиться, что секрет `PROJECT_TOKEN` задан в **korzhanov/expressiontab** (значение нигде больше не дублировать).
2. Actions → **project auto triage** → Run workflow → backfill = true (один раз для уже открытых PR).
3. Новые PR (`opened` / `reopened` / `ready_for_review`) попадут в проект сами.

### Альтернатива без Actions

В самом проекте: ⚙️ → Workflows → **Auto-add to project** → выбрать репозиторий `korzhanov/expressiontab` (нативный триггер GitHub, без PAT).

## Development flow (кратко)

См. [docs/DEV_FLOW.md](../docs/DEV_FLOW.md) и Cursor rules в `.cursor/rules/`.
