# Pitfalls and recovery

| Symptom | Cause | Do this |
| --- | --- | --- |
| `No Teable app workspace found` | Not inside a checkout and no `--dir` | `cd` into the checkout, or `teable app clone --app-id … --dir …` |
| `Project ID is required` | Directory not bound and no `--base-id` | `teable link` (lists candidates) then `teable link <baseId>`; ask the user when several match |
| `This Teable deployment has no git registry` | Self-hosted instance without the app code control plane | Build in the in-app App Builder; `teable app get-code` for a read-only copy; `import-code` (ZIP) via `teable call-api` to replace the project |
| `This app has no code yet` on clone | App never generated and scaffold not written | `teable app clone` writes the scaffold itself; if it still fails, the deployment lacks a registry |
| `push`: `Platform-owned files were modified` | A locked file (see `AGENTS.md`) was edited | `git checkout <base> -- <file>`, commit, push again; put the change elsewhere |
| `push`: `Env files are tracked by git` | `.env` or `.env.*` committed | `git rm --cached <file>`, commit; the server-generated `.gitignore` already lists them |
| `push`: `teable/queries.yaml is invalid` | Manifest fails the lint | `teable query lint --file teable/queries.yaml`, fix; `--skip-lint` only to see the server's message |
| `push`: `The app repository moved` / `pull`: `diverged` | Someone saved in Teable or pushed meanwhile | `teable app pull`; if diverged: commit or stash, `git rebase teable/main`, resolve, `teable app pull`, push |
| `push`: `The App Builder is generating this app right now` | Cuppy is mid-generation in Teable | Wait, `teable app pull`, push again |
| `push`: `Commit … is not the head of main` | Something pushed between your push and the version record | `teable app pull`, push again (idempotent) |
| `push` succeeded with `serverCommitPulled: true` | Teable regenerated query artifacts on top | Nothing; the checkout already holds the server commit |
| Preview in Teable not updated after push (`previewRefreshed: false`) | No preview sandbox was running | Open the app in Teable; the preview starts from the latest version |
| Login (OTP / Google / Teable sign-in) fails on localhost | Callbacks go to the preview origin | Expected; push and verify in the Preview panel in Teable |
| `getConnectionToken` → `not_granted` | Connection not granted to this app | `teable secret grant --type connection --id <id> --resource app:<appId> --alias <ALIAS>` |
| Secret works in preview but not under `pnpm dev` | Granted secrets are injected only into preview/deploy | The user reruns `teable secret set --key <KEY> --grant app:<appId> --dev-env` in a terminal window of their own (it writes `.env.local`), or adds the key there by hand |
| Codex: `git push` or CLI call blocked | Network sandbox | Approve network access for the session |
| `schema/*.json` merge conflict | Two syncs at different schema states | Take either side, then `teable app pull` (regenerates them) |
| `AGENTS.md` / `CLAUDE.md` show as untracked | Expected: platform `.gitignore` excludes them | Never add them; `teable app pull` rewrites them |

Two rules worth repeating:

- The platform's AGENTS.md is the source of truth for stack and conventions; this skill only
  wraps the workflow. When they disagree, AGENTS.md wins.
- Nothing in this workflow spends Teable AI credits; publishing uses the app's hosting as usual.
