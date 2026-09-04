# AGENTS.md

## What this repo is

GitHub Actions bot (`go-green-github`) that fakes a green contribution graph: it commits `data.json` with random `git --date` timestamps (08:00–17:00 WIB) and pushes once per day. Do not "clean up" this behavior — it is the entire point.

## Commands

```sh
npm ci          # restore node_modules (NOT tracked in git)
npm run build   # tsc -> dist/ (required before running)
npm test        # node:test via tsx, runs test/*.test.ts
npm run dev     # tsx src/index.ts
```

## Gotchas (hard-won)

- **Never run `npm start` / `node dist/index.js` in this working tree** — it commits + pushes for real. Test it in a temp git repo (with a `git remote add origin <bare>` if you need push).
- **`test/`, `dist/`, and `node_modules/` are gitignored by design.** `test/` is deliberately excluded from git (owner's choice). Never re-track `node_modules` — it was tracked once and caused mass merge conflicts.
- TS source imports use `.js` extensions (`import './schedule.js'`), required by `NodeNext` ESM + `tsc`. Tests import `../src/xxx.ts` directly (tsx). Don't "fix" either.
- `holidays.json` is manually maintained per year from the official SKB 3 Menteri (setneg.go.id); there is no automation. Missing year => every weekday gets weekday counts.
- `GIT_EMAIL` (`90607773+machfudn@users.noreply.github.com`) must stay a valid GitHub noreply, or commits won't attribute to the graph.
- Commit scheduling is env-driven (defaults 5–10 weekdays, 1–3 weekends/holidays, window 8–17). Set via workflow `env:`, not hardcoded.
- Some files carry a spurious `644 → 755` mode change from an old merge-conflict session. Harmless; don't churn on it.

## Architecture

- `src/schedule.ts` — pure logic: timezone math via `Intl` (no moment), `pickCount`, `generateCommitTimes` (unique, sorted), holiday checks.
- `src/config.ts` — env parsing + validation + `loadHolidays`.
- `src/commit.ts` — orchestrator `runOnce` with injected `GitLike`/`Writer` (mocked in tests).
- `src/index.ts` — entry, wires real git + fs.
- `.github/workflows/auto-green.yml` — cron `5 0 * * *` UTC, then `npm ci` → `npm run build` → set git identity → `node dist/index.js`. Includes a random-delay step (0–5 h) so push time is randomized.

## Conventions

- Conventional Commits (e.g. `feat:`, `fix:`, `chore:`), imperative mood, English.
- Tests use `node:test` + `assert/strict`; TDD red→green per seam (schedule, config, commit).
