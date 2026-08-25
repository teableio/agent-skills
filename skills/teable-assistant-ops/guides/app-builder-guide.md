# App Builder Guide

## When to Use

- Dashboards with live data, custom web interfaces, interactive tools, monitoring panels
- **Do NOT use for**: simple one-time charts — use inline HTML code blocks instead
- **Do NOT duplicate**: basic CRUD / admin interfaces — the database already has built-in UI

## Workflow

1. `app list` — check existing apps (update existing instead of creating duplicate); use `--search` for a case-insensitive name filter
2. When an existing app's implementation is relevant, `app get-code` downloads a read-only source snapshot for context
3. `app create` / `app update` — create or update app
4. Include `--table-ids` to give the app data access
5. The app runtime includes an AI API for text and image generation — pass AI-related features in `--prompt` and the builder handles integration

**Optional capabilities** (applied to an app independently, in any order):
- **AI access** — `app ai-enable` + `app ai-docs` (see [AI in apps](#ai-in-apps))
- **End-user login** — `app login-config` (see [App login / authentication](#app-login--authentication))

```bash
# Create new app
teable app create \
  --name "Sales Dashboard" \
  --prompt "build a sales dashboard showing monthly revenue trends" \
  --table-ids '["tblXXX","tblYYY"]'

# Update existing app
teable app update \
  --app-id appXXX \
  --prompt "add a filter by date range"
```

## Key Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--prompt` | Yes | User's request — pass exactly as stated |
| `--name` | Create only | App name |
| `--app-id` | Update only | Target app ID |
| `--table-ids` | No | JSON array of table IDs for data access |
| `--attachment-tokens` | No | Screenshots or design reference images |
| `--folder-id` | No | Place the new app in a folder (`folderId` from the active tab meta); omit for base root |

## Key Rules

- Complete requested setup, inspection, analysis, and data changes before calling the builder; do not put those steps in `--prompt`
- **Pass the user's app intent faithfully** to `--prompt`; include only app purpose, UI/workflow, explicit constraints, relevant table IDs, and verified data context—do not add features
- Do not use markdown formatting in the requirement text
- Do not specify tech stack unless the user explicitly requests it

## Read an existing app's code

When an app is mentioned and its implementation is needed as context, download its latest saved source:

```bash
teable app get-code --app-id appXXX
```

The command extracts a detached snapshot to `~/.teable/refs/<appId>/`. Treat it as **read-only**: local edits do not update the app and can be overwritten by a later download. Environment files and secrets are excluded. Use `app update` to make changes. The command requires app editing permission (Base Owner/Creator).

## Delete an app

```bash
teable app delete --app-id appXXX
```

**Warning:** this permanently deletes the app. Verify `--app-id` before running it.

## AI in apps

When an app needs to call AI (text/image generation) from its own server-side code, enable the proxy:

```bash
teable app ai-enable --app-id appXXX
```

- **Idempotent** — safe to run when already enabled.
- Injects `TEABLE_AI_API_BASE_URL` and `TEABLE_AI_API_KEY` into the app on its **next preview restart**.
- The proxy is **Anthropic-compatible** and **server-side only** — never expose `TEABLE_AI_API_KEY` to the browser. The key value is never printed.
- System-model usage consumes credits; BYOK models run on the space's own key.

For usage patterns and the **available model keys for the current base** (resolved dynamically), read the docs — do not hardcode model names:

```bash
teable app ai-docs            # equivalent to: teable get-doc --topic app.ai
```

Both commands require the target base (explicitly or through the configured project base ID).

## App login / authentication

By default a generated app is open. To require end-users to authenticate before accessing it, set a login config:

```bash
teable app login-config --app-id appXXX --login-config '{
  "enabled": true,
  "userTableId": "tblXXX",
  "emailFieldId": "fldXXX",
  "providers": [{ "type": "email-otp" }]
}'
```

**`loginConfig` shape:**

| Field | Description |
|-------|-------------|
| `enabled` | `true` to require login, `false` to disable |
| `userTableId` | Table ID that stores user records |
| `emailFieldId` | Field ID of the email column in the user table |
| `providers` | Array of `{ "type": ... }`: `"email-otp"`, `"google"`, or `"teable"` |
| `access` (optional) | `{ "mode": "open" \| "domain" \| "existing-only", "domains": [...] }` — `domains` only used in `domain` mode |

Pass `--login-config null` to disable login entirely.

## Publish lifecycle

```bash
teable app publish --app-id appXXX
teable app status --app-id appXXX
teable app unpublish --app-id appXXX
```

`app publish` may return `deploying`; poll `app status` until the result is `success` or `failed`.