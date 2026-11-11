# Local App Development Guide

Use local development when the user wants to edit app code with external tools. For prompt-driven changes use [App Builder](app-builder-guide.md); for inspection alone use `app get-code`, whose snapshot is not a pushable checkout.

## Checkout → sync → edit → save

1. Check `app list` before creating anything. Use `app init` for a new app or `app clone` for an existing app. Both require project Owner/Creator editing/create permission and a deployment with a git registry; choose an empty or absent target directory. Cloning an app never generated before first creates scaffold version 1.
2. Read the checkout's `AGENTS.md` and `CLAUDE.md`, then install dependencies and start local development (`pnpm install && pnpm dev`). The checkout includes `.env`, `teable.md`, schema files, and the `teable` remote; protect credentials from logs and version control.
3. Run `app pull` before starting work and after app/table changes in Teable. Review its schema delta and pending named-query repairs before editing reads; see [query repair workflow](data-query-guide.md#schema-changes-and-repairs).
4. Edit only app-owned files. Use `app push` to save a new version and refresh the preview. A message commits uncommitted changes and becomes the user-facing version description; without a message, commit the working tree first. Describe the visible result, not implementation trivia.
5. Publishing is separate: use `app publish --wait` only when requested, then report the final result/public URL. Progress goes to stderr, final JSON to stdout.

App checkouts carry project binding in `.teable/app.json`. Publish, versions and rollback can infer the app from the enclosing checkout; pass an explicit app ID when targeting another app.

## Recovery and safety

| Situation | Action |
|-----------|--------|
| Pull stops with `diverged` | Rebase onto `teable/main`, resolve conflicts, then pull again; do not overwrite remote work |
| Push says repository moved ahead | Pull and reconcile before pushing |
| Push detects locked/platform-owned files | Revert those changes; the platform rewrites them |
| Env files or `.teable/cli` tracked or touched by outgoing commits | Remove secrets from the outgoing history, not just the working tree; do not bypass the check |
| Query lint fails | Fix the manifest; `--skip-lint` skips only local lint, not server validation |
| Need an earlier app state | Inspect `app versions`, confirm the target, then `app rollback`; it creates a new version without rewriting history |

Rollback changes Teable, not the local checkout. Pull afterwards, including after a backend query repair creates a new version. Do not assume rollback publishes the restored code.
