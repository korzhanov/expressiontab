# Development & GitHub flow (ExpressionTab)


## Поток задачи

```text
idea / баг
  → gh issue create (+ Project #9)
  → ветка NNN-short-slug от main
  → код + bun test
  → push + gh pr create --base main (Fixes #NNN)
  → прогресс-комменты в issue/PR
  → review → merge (человек) → issue Done
```

## Правила агента (Cursor)

| Файл | Зачем |
|------|--------|
| `.cursor/rules/issue-before-fix.mdc` | Сначала issue, потом код; Project #9 |
| `.cursor/rules/branch-pr-not-direct-commit.mdc` | Не пушить в `main` напрямую |
| `.cursor/rules/pr-task-tree.mdc` | Чеклист + линки child PR/issues |
| `.cursor/rules/issue-pr-progress-visual.mdc` | Итоги простым языком + скрины UI |
| `.cursor/rules/russian-line-comments.mdc` | Комментарии в коде на русском |
| `.cursor/rules/extension-dev-rules.mdc` | Svelte / MV3 / perf |
| `.cursor/rules/public-repo-security.mdc` | Публичный репо: секреты, PAT, permissions |
| `AGENTS.md` | Предпочтения и факты репо |
| `.cursorrules` | Краткий устав |

## Команды

```bash
bun install
bun test
bun run build
# Load unpacked: builds/expressiontab
```

## GitHub

- Repo: https://github.com/korzhanov/expressiontab
- Project board: https://github.com/users/korzhanov/projects/9
- Auto-triage: `.github/workflows/project-auto-triage.yml` (секрет `PROJECT_TOKEN`, scope PAT = только `project`)
- Шаблоны: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`
- Безопасность: `.cursor/rules/public-repo-security.mdc`

## Скрины для PR

Класть в `docs/pr-evidence/<issue-or-pr>/` и ссылаться из комментария PR.
