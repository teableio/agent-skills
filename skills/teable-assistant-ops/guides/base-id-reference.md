# --base-id Reference

`--base-id` can be pre-configured via `teable config`. When the user explicitly provides a base ID, pass it with `-b` / `--base-id` to the commands below.

Commands that accept it show `-b, --base-id <baseId>` in their options. The tables below list all commands.

## Commands that accept --base-id

### Data Query

| Command | Also requires |
|---------|---------------|
| `table get` | — |
| `field get`, `record get`, `view get` | `--table-id` |
| `sql-query` | `--sql` |
| `get-ai-config`, `get-collaborators` | — |

### CRUD

| Command | Also requires |
|---------|---------------|
| `table create` | — |
| `table update/delete` | `--table-id` |
| `field create` | `--table-id` |
| `field update/delete` | `--table-id`, `--field-id` |
| `record create/update/delete` | `--table-id` |
| `view create` | `--table-id` |
| `view update/delete` | `--view-id` |

### Node & Folder

| Command | Also requires |
|---------|---------------|
| `get-node-tree` | — |
| `folder create` | `--name` |
| `folder rename/delete` | `--folder-id` |
| `folder move` | `--node-id` |

### AI / App

| Command | Also requires |
|---------|---------------|
| `trigger-ai-fill` | `--table-id`, `--field-id` |
| `app list/create/update` | — |
| `app login-config/ai-enable` | `--app-id` |
| `app ai-docs` | — |

### Automation

| Command | Also requires |
|---------|---------------|
| `automation list` | — |
| `automation get/get-runs/get-run` | `--workflow-id` |
| `automation setup-trigger` | `--trigger-type` |
| `automation activate/test-node/delete-node` | `--workflow-id`, `--node-id` (except activate) |
| `automation generate-script/generate-flowchart/get-script-input` | `--workflow-id`, `--action-id` |

### Advanced

| Command | Also requires |
|---------|---------------|
| `search-api` | `--query` |
| `call-api` | `--method`, `--url` |
| `import` | `--file` or `--attachment-token` + mode flag |
| `scrape` | `--dataset-id`, `--inputs` |
| `send-email` | `--subject`, `--body`, `--to`/`--bcc` |
| `import-airtable` | `--airtable-base-id` + `--space-id`/`--base-name` (new base) — note: `--base-id` here is an **optional import target** (no `-b` short flag), not the usual project base |
| `tools list`, `get-doc` | `--topic` (get-doc only) |

## Commands that do NOT need --base-id

`auth` / `auth status`, `config`, `upload-attachment`, `import-status`, `integration list/connect/get-token`, `env list/set/update/delete`
