# Environment Variables / Secrets Guide

Use `teable env` to store secrets (API keys, tokens) that apps and automation scripts read at runtime via `process.env.KEY`. This is cross-cutting — it serves both [App Builder](app-builder-guide.md) and [Automation](automation-guide.md) scripts.

## Scopes

Every env variable lives in one of three namespaces, selected with `--scope` (+ `--scope-id` where required):

| Scope | `--scope` | `--scope-id` | Read by |
|-------|-----------|--------------|---------|
| User | `user` | — | Your apps/scripts across the account |
| App | `app` | `appXXX` | A specific app |
| Automation | `automation` | `wflXXX` | A specific workflow's scripts |

> Env commands are **not** scoped by `--base-id` — they take no `-b` flag. The namespace is set entirely by `--scope` / `--scope-id`.

## Key Format

Keys must match `^[A-Z][A-Z0-9_]{0,63}$` — uppercase letter first, then uppercase letters / digits / underscores (max 64 chars). Examples: `OPENAI_KEY`, `STRIPE_KEY`, `SLACK_WEBHOOK_URL`.

## Commands

| Command | Purpose |
|---------|---------|
| `env list` | List variables in a namespace |
| `env set` | Create or update by key (**upsert**) |
| `env update` | Change value/description by id (`evvXXX`) |
| `env delete` | Delete by id (`evvXXX`) |

```bash
# List
teable env list --scope user
teable env list --scope app --scope-id appXXX

# Set (upsert by key) — replaces value if the key already exists
teable env set --scope user --key OPENAI_KEY --value sk-xxx
teable env set --scope automation --scope-id wflXXX --key STRIPE_KEY --value sk_test_... -d "Stripe test key"

# Update value / description by id
teable env update --id evvXXX --value new-value

# Delete by id
teable env delete --id evvXXX
```

**`env set` flags**: `-S, --scope`, `--scope-id`, `-k, --key`, `-v, --value`, `-d, --description` (optional).

## How values are read

Apps and automation scripts read secrets via standard `process.env`:

```javascript
const apiKey = process.env.STRIPE_KEY;
```

For automation scripts, provision the secret in the workflow scope, then reference it in-script — see [automation-guide.md § Script Rules](automation-guide.md#script-rules). The built-in `AUTOMATION_TOKEN` / `PUBLIC_ORIGIN` vars are always present and are separate from these custom secrets.
