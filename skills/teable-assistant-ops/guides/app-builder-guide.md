# App Builder Guide

## When to Use

- Dashboards with live data, custom web interfaces, interactive tools, monitoring panels
- **Do NOT use for**: simple one-time charts — use inline HTML code blocks instead
- **Do NOT duplicate**: basic CRUD / admin interfaces — the database already has built-in UI

## Workflow

1. `app list` — check existing apps (update existing instead of creating duplicate)
2. `app create` / `app update` — create or update app
3. Include `--table-ids` to give the app data access
4. The app runtime includes an AI API for text and image generation — pass AI-related features in `--requirement` and the builder handles integration

**Optional capabilities** (applied to an app independently, in any order):
- **AI access** — `app ai-enable` + `app ai-docs` (see [AI in apps](#ai-in-apps))
- **End-user login** — `app login-config` (see [App login / authentication](#app-login--authentication))

```bash
# Create new app
teable app create \
  --name "Sales Dashboard" \
  --requirement "build a sales dashboard showing monthly revenue trends" \
  --table-ids '["tblXXX","tblYYY"]'

# Update existing app
teable app update \
  --app-id appXXX \
  --requirement "add a filter by date range"
```

## Key Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--requirement` | Yes | User's request — pass exactly as stated |
| `--name` | Create only | App name |
| `--app-id` | Update only | Target app ID |
| `--table-ids` | No | JSON array of table IDs for data access |
| `--attachment-tokens` | No | Screenshots or design reference images |
| `--folder-id` | No | Place the new app in a folder (`folderId` from the active tab meta); omit for base root |

## Key Rules

- **Pass user requirements verbatim** to `--requirement` — do not interpret, expand, or add features
- Do not use markdown formatting in the requirement text
- Do not specify tech stack unless the user explicitly requests it

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