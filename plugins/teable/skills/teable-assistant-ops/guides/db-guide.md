# Local Database Sync Guide

Use `db` to work on a local clone of a Project and review changes before syncing upstream. This is database sync, not the [app-code checkout workflow](app-development-guide.md). Requires CLI 0.6.55 or later and access to the remote Project for clone and sync.

## Safe working sequence

1. Confirm the Project and target directory, then clone. The working database is binary PGlite in `.teable/vcs/pglite`; do not treat it as editable JSON. Use a sparse or schema-only clone only when that reduced scope fits the task. Do not overwrite an existing workspace with `--force` without confirmation.
2. Inspect `db status`. From the clone directory, use supported data commands with `--local` for local reads and writes. Check each selected command's help: local targeting is not universal. Omitting `--local` must not be treated as an offline write.
3. Review `db diff`: by default it compares with the live remote. Use `--offline` only to compare against `base.snapshot.json`; that does not establish that the remote is unchanged. A JSON display review is capped at 200 change rows, not proof that a larger diff is fully reviewed.
4. Run `db pull` to fetch upstream changes and perform a three-way merge. Inspect `db conflicts` before proceeding. Resolve individual conflicts deliberately: `--ours` keeps local changes, `--theirs` takes remote changes, and `--value-json` supplies a manual value. Do not blanket-resolve with `--all` or change the multi-value merge strategy just to suppress conflicts.
5. Recheck status and diff, then run `db push --dry-run` to validate server-side push/rebase safety without committing. Obtain approval for destructive or broad changes before the real push; use a message describing the intended result.
6. Verify remote results. Push uses CAS revision protection: if upstream changed, pull, resolve and review again rather than bypassing the concurrency failure. A successful dry-run does not lock the remote revision.

The database and sync commands target directories differently; keep the workspace explicit when operating outside it:

```bash
teable db clone bseXXXX ./my-project
cd ./my-project
teable table get --local
# Perform the reviewed edits with supported commands and --local.
teable db diff
teable db pull
teable db conflicts
teable db push --dry-run
# Only after reviewing the merged diff and obtaining required approval:
teable db push -m "Apply reviewed project changes"
```

## Targeting pitfalls

| Situation | Decision |
|-----------|----------|
| Switching between local and remote work | Confirm both directory and Project; do not mix remote reads with local writes unintentionally |
| App, authority, automation or artifact operation accepts `--local` | It targets the cloned database instead of the remote server; do not infer that remote deployment, AI, email or external-service behavior is reproduced locally |
| Need an HTTP endpoint for the clone | Use `db serve`; keep its default loopback binding unless exposure is explicitly intended. Serving locally is not a push or publication |
| Need to synchronize app source files | Use `app pull/push`, not `db pull/push`; see the app-development guide |
