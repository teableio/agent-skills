# App Builder Guide

## When to Use

Use `generate-app` when users want to build:
- Dashboards with live data
- Custom web interfaces / portals
- Interactive tools with user input
- Monitoring panels with real-time updates

**Do NOT use for**: simple one-time charts or reports — use inline HTML code blocks instead.

**Do NOT duplicate**: basic CRUD / admin interfaces — the database already has built-in UI for that. Focus on custom visualizations, interactions, and unique user experiences.

## Workflow

### 1. Check existing apps
```bash
teable get-apps
```

### 2. Create or update
```bash
# Create new app
teable generate-app \
  --action create \
  --name "Sales Dashboard" \
  --requirement "build a sales dashboard showing monthly revenue trends" \
  --table-ids '["tblXXX","tblYYY"]'

# Update existing app
teable generate-app \
  --action update \
  --app-id appXXX \
  --requirement "add a filter by date range"
```

## Key Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--action` | Yes | `create` or `update` |
| `--requirement` | Yes | User's request — pass exactly as stated |
| `--name` | No | App name (for create) |
| `--app-id` | For update | Target app ID |
| `--table-ids` | No | Array of table IDs for data access |
| `--attachment-tokens` | No | Screenshots or design reference images |

## Important Rules

1. **Pass user requirements verbatim** — do not interpret, expand, or add extra features
2. **Do not use markdown** in the requirement text
3. **Do not specify tech stack** unless the user explicitly requests it
4. **Keep the original intent** — if user says "add a button", just pass "add a button"
5. **Built-in AI API** is available in app builder for text and image generation features
