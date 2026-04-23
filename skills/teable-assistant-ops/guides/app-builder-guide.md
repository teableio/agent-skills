# App Builder Guide

> **Required**: `app create --help` — parameters, requirement rules, full usage

## When to Use

- Dashboards with live data, custom web interfaces, interactive tools, monitoring panels
- **Do NOT use for**: simple one-time charts — use inline HTML code blocks instead
- **Do NOT duplicate**: basic CRUD / admin interfaces — the database already has built-in UI

## Workflow

1. `app list` — check existing apps (update existing instead of creating duplicate)
2. `app create` / `app update` — create or update app
3. Include `--table-ids` to give the app data access
4. Built-in AI API available for text/image generation features

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
| `--action` | Yes | `create` or `update` |
| `--requirement` | Yes | User's request — pass exactly as stated |
| `--name` | Create only | App name |
| `--app-id` | Update only | Target app ID |
| `--table-ids` | No | JSON array of table IDs for data access |
| `--attachment-tokens` | No | Screenshots or design reference images |
| `--description` | No | App description |

## Key Rules

- **Pass user requirements verbatim** to `--requirement` — do not interpret, expand, or add features
- Do not use markdown formatting in the requirement text
- Do not specify tech stack unless the user explicitly requests it