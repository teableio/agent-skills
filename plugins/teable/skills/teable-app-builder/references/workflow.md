# End-to-end workflow

Everything below runs on the user's machine. Replace ids as needed; inside a checkout the
`--base-id` and `--app-id` flags are optional because `.teable/app.json` carries them.

## A. First-time setup (once per machine)

```bash
npx -y @teable/cli@latest auth login      # opens the browser; or export TEABLE_TOKEN=<PAT>
teable auth status                        # account + endpoint
```

Self-hosted: `teable auth login --endpoint https://teable.example.com`, or set `TEABLE_ENDPOINT`.

## B. Pick the project

```bash
teable base list --search "Inventory"     # by name; one hit → use it, several → ask the user
teable link                               # no argument: candidates for the current directory
teable link bseXXXX                       # bind the directory (optional for app checkouts)
```

Building something new rather than on existing data: create the project first, then its tables.

```bash
teable base create --space-id spcXXXX --name "CRM"   # say which space it lands in
teable link bseXXXX
```

## C. New app

```bash
teable app init --name "Inventory count" --dir ./inventory
cd inventory
cat CLAUDE.md                             # imports AGENTS.md; read it before coding
pnpm install && pnpm dev                  # http://127.0.0.1:3000
```

`init` creates the app in Teable, writes the scaffold as version 1, clones the repository
(remote `teable`, branch `main`) and writes `.env`, `AGENTS.md`, `CLAUDE.md`, `teable.md`,
`schema/*.json` and `.teable/app.json`.

## D. Existing app

```bash
teable app list                           # find the id
teable app clone --app-id appXXXX --dir ./inventory
```

An app that was never generated gets the scaffold as version 1 during clone.

## E. Daily loop

```bash
teable app pull                           # fast-forward + refresh AGENTS.md/.env/teable.md/schema
# edit; verify with curl -s http://127.0.0.1:3000 and the browser
teable app push -m "Stock count page with barcode input"
```

What `push` does, in order:

1. Commits the working tree with `-m` (or requires it clean).
2. Refuses tracked `.env*` files.
3. Lints `teable/queries.yaml` locally if present (`--skip-lint` to let the server decide).
4. Fetches `teable/main`; refuses when the remote moved past the checkout (pull first).
5. Refuses when platform-owned files changed since the recorded version.
6. Pushes `HEAD` to `main`, then records the commit as the next Teable version. Teable validates
   the named queries, refreshes a running preview and notes the push in the app chat.
7. If Teable regenerated query artifacts on top of the push, the checkout is fast-forwarded to
   that commit (`serverCommitPulled: true`).

## F. Table-schema changes made by someone else

`teable app pull` prints `schemaChanges` such as `changed: Orders (tblXXX) — field added: Status
(singleSelect)` and refreshes `schema/*.json`. Then:

- Adjust the code that reads the changed table (search the field id or name).
- If the app declares named queries (`teable/queries.yaml`), check `pendingQueryRepairs`:
  - `teable query repairs --app-id appXXXX` lists them; `--repair-id <id>` shows change, plan and
    diff.
  - `applyable: true` → `teable query repair-apply --repair-id <id>` writes a new app version with
    the rewritten manifest; then `teable app pull`.
  - `applyable: false` → a human decision is needed (filter or grouping semantics changed, SQL
    mentions the field, …). Edit `teable/queries.yaml` yourself, run
    `teable query generate --file teable/queries.yaml --out lib/queries.ts --live`, push, and
    `teable query repair-dismiss --repair-id <id> --reason "handled in v<n>"`.

## G. Publish and history

```bash
teable app publish --wait                 # streams: version-save, artifact-build, …, finalize → publicUrl
teable app status                         # when publish was started without --wait
teable app versions                       # newest first, with the push subjects as descriptions
teable app rollback --to 7 && teable app pull
```

## H. Secrets and connections

```bash
teable secret list --resource app:appXXXX
# the user runs this in a terminal window of their own (not `!` in Claude Code: no TTY);
# it prompts for the value without echo and also writes it to the checkout's .env.local:
teable secret set --key STRIPE_KEY --grant app:appXXXX --dev-env
teable integration connect --provider slack            # browser consent
teable secret grant --type connection --id <connectionId> --resource app:appXXXX --alias SLACK
```

Granted secrets reach the Teable preview and deployments; `--dev-env` puts the same key in
`.env.local` (gitignored) for `pnpm dev`. Connections work locally through `getConnectionToken('<ALIAS>')`
because the exchange goes through the Teable API with the app token in `.env`.
