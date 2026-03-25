# CLI Command Reference

Run `teable <command> --help` for full options of any command.

## Table of Contents
- [CLI Command Reference](#cli-command-reference)
  - [Table of Contents](#table-of-contents)
  - [Global Options](#global-options)
  - [Data Query Commands](#data-query-commands)
    - [get-records notes](#get-records-notes)
  - [Field Management](#field-management)
    - [create-field](#create-field)
    - [update-field / delete-field](#update-field--delete-field)
  - [Record Management](#record-management)
    - [create-records](#create-records)
    - [update-records](#update-records)
    - [delete-records](#delete-records)
  - [Table Management](#table-management)
    - [create-table](#create-table)
    - [update-table / delete-table](#update-table--delete-table)
  - [Node \& Folder Management](#node--folder-management)
    - [get-node-tree](#get-node-tree)
    - [create-folder](#create-folder)
    - [rename-folder / delete-folder](#rename-folder--delete-folder)
    - [move-node](#move-node)
  - [View Management](#view-management)
  - [SQL Query](#sql-query)
    - [Critical rules:](#critical-rules)
    - [System fields (always available):](#system-fields-always-available)
  - [Data Import](#data-import)
    - [import](#import)
  - [AI Fill](#ai-fill)
    - [trigger-ai-fill](#trigger-ai-fill)
  - [Automation Commands](#automation-commands)
  - [Integrations \& Advanced](#integrations--advanced)
    - [connect-integration](#connect-integration)
    - [get-user-integrations](#get-user-integrations)
    - [search-api + call-api](#search-api--call-api)
  - [Web Scraping](#web-scraping)
  - [Documentation](#documentation)
  - [Tool Discovery](#tool-discovery)

## Global Options

Most commands accept `--base-id <baseId>`, but it can be omitted if a default base is configured via `teable config`. Auth is resolved from config or `--token` / `TEABLE_TOKEN`. For a full list of which commands accept `--base-id`, see [base-id-reference.md](base-id-reference.md).

Use `teable config show` to check current config (endpoint, baseId, token status) when troubleshooting.

## Data Query Commands

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-tables-meta` | List tables (returns tableId, dbTableName) | |
| `get-fields` | Field definitions (returns fieldId, dbFieldName, type) | `--table-id` |
| `get-records` | Query records with pagination | `--table-id`, `--take`, `--skip`, `--search-value`, `--projection` |
| `get-views` | List views in a table | `--table-id` |

### get-records notes
- Default 100 records, max 1000
- Without `--projection`, only first 20 fields returned; use `--projection '["all"]'` for all (max 50)
- Search: `--search-value "keyword" --search-field-id "FieldName | FieldId"`

## Field Management

### create-field
Create a field (column) in a table.

**Type aliases**: `text`, `long`, `num`, `sel`, `multi`, `check`, `rate`, `date`, `user`, `file`, `link`, `rollup`, `formula`, `condRollup`, `auto`, `created`, `modified`, `createdby`, `modifiedby`, `btn`

**Advanced field types:**

**Link** — connect tables:
```
--type link --options '{"foreignTableName": "Projects"}'
```

**Lookup** — display data from linked tables:
```
--is-lookup --lookup-options '{"linkFieldName": "Project", "lookupFieldName": "Status"}'
```

**Rollup** — aggregate linked records:
```
--type rollup --lookup-options '{"linkFieldName": "Tasks", "lookupFieldName": "Hours"}' --options '{"expression": "SUM({values})"}'
```

**Formula** — calculated values (field names auto-converted to IDs):
```
--type formula --options '{"expression": "{Budget} - {Actual}"}'
```

**Conditional Lookup** — query any table with filters (no link needed):
```
--is-lookup --is-conditional-lookup --lookup-options '{"foreignTableName": "...", "filter": {...}, "lookupFieldName": "..."}'
```

**AI Field** — AI-generated content:
```
--ai-config '{"type": "summary", "sourceFieldName": "Description"}'
```
Run `get-ai-config` to get available models and full aiConfig schema.
After creating/updating AI field, must call `trigger-ai-fill` to generate content.

### update-field / delete-field
- `update-field --table-id tblXXX --field-id fldXXX --name "New Name" --type num`
- `delete-field --table-id tblXXX --field-id fldXXX` (permanent)

## Record Management

### create-records
Compact array format:
```
--header '["Name","Status","Priority"]' --records '[["Task A","Done","High"],["Task B","Pending","Low"]]'
```

**Value types in compact array:**
| Type | Format | Example |
|------|--------|---------|
| Text | `"string"` | `"Task A"` |
| Number | `42` | `123.45` |
| Boolean | `true` / `null` | checkbox: `true` (checked), `null` (unchecked, NOT `false`) |
| Date | `"ISO string"` | `"2025-01-27"` or `"2025-01-27T10:30:00.000Z"` |
| Select | `"choice"` | `"Done"` |
| Multi-select | `["A","B"]` | `["Bug","Feature"]` |
| Link | `"Record Name"` | `"Project Alpha"` (with `--typecast`) |
| User | `"name/email"` or `{"id":"usrXXX","title":"Name"}` | `"Alice"` or `"alice@example.com"` (with `--typecast`) or `{"id":"usrXXX","title":"Alice"}` |
| Attachment | `[{name,token}]` | `[{"name":"file.png","token":"attXXX"}]` |

Attachment values are **always arrays of objects**, never strings. Each object requires `name` and `token`. Get tokens via `upload-attachment --file-path /path/to/file`.

Use `--typecast` to auto-convert values to proper field types.

**Batch limits**: max 1000 records per call. For larger datasets, split into multiple calls.
### update-records
Compact array format — header first element MUST be `"recordId"`:
```
--header '["recordId","Name","Status"]' --records '[["recAAA","Updated Name","Done"],["recBBB","","Pending"]]'
```
- `""` (empty string): skip field (no change)
- `null`: clear the cell
- Attachment: pass full array `[{name,token}]` — this **replaces** all existing attachments, not appends

**Batch limits**: max 1000 records per call. For larger datasets, split into multiple calls.

### delete-records
```
--table-id tblXXX --record-ids '["recXXX", "recYYY"]'
```

**Batch limits**: max 2000 record IDs per call. For larger datasets, split into multiple calls.

## Table Management

### create-table
```
--table-name "Tasks" --fields '["Title:text","Status:sel:Todo,Done","Due:date"]' --icon "📋"
```

### update-table / delete-table
- `update-table --table-id tblXXX --name "New Name"`
- `delete-table --table-id tblXXX` (permanent)

## Node & Folder Management

Bases contain a tree of nodes — tables, folders, dashboards, apps, and workflows. Use these commands to organize them into folders and control their order.

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-node-tree` | Get full node hierarchy of a base | |
| `create-folder` | Create a new folder | `--name` |
| `rename-folder` | Rename a folder | `--folder-id`, `--name` |
| `delete-folder` | Delete an empty folder (move children out first) | `--folder-id` |
| `move-node` | Move/reorder a node | `--node-id`, `--parent-id`, `--anchor-id`, `--position` |

### get-node-tree
Returns the tree structure of all nodes in the base — use this first to understand current organization before making changes.
```bash
teable get-node-tree
```

### create-folder
```bash
teable create-folder --name "Reports"
```

### rename-folder / delete-folder
```bash
# Rename
teable rename-folder --folder-id fldXXX --name "Monthly Reports"
# Delete — folder must be empty; move children out first with move-node
teable delete-folder --folder-id fldXXX
```

### move-node
Move a node (table, folder, dashboard, etc.) into a folder, out to root, or reorder within the same level.
```bash
# Move a table into a folder
teable move-node --node-id tblXXX --parent-id fldYYY
# Move to root (no parent)
teable move-node --node-id tblXXX --parent-id null
# Reorder: place node before a sibling
teable move-node --node-id tblXXX --anchor-id tblYYY --position before
# Reorder: place node after a sibling inside a folder
teable move-node --node-id tblXXX --parent-id fldYYY --anchor-id tblZZZ --position after
```

## View Management

**View types**: `grid` (default), `kanban`, `form`, `gallery`, `calendar`

| Command | Key Options |
|---------|-------------|
| `create-view` | `--table-id`, `--name`, `--type grid\|kanban\|form\|gallery\|calendar` |
| `update-view` | `--view-id`, `--name`, filter/sort/group config |
| `delete-view` | `--view-id` (permanent) |

## SQL Query

**READ-ONLY** — only SELECT statements allowed (PostgreSQL 15.4).

### Critical rules:
1. **Must use database names**: call `get-tables-meta` for `dbTableName`, `get-fields` for `dbFieldName`
2. **Table format**: `"baseId"."dbTableName"` (e.g., `"bseXXX"."receipts"`)
3. **Double-quote all identifiers**: `SELECT "field" FROM "schema"."table"`
4. **Add LIMIT 100** for non-aggregate queries
5. **JSON fields**: `json_extract_path_text("field"::json, 'key')`

### System fields (always available):
`__id`, `__auto_number`, `__created_time`, `__last_modified_time`, `__created_by`, `__last_modified_by`, `__version`

## Data Import

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `import` | Unified import: preview, create table, or append to existing | `--file`, `--attachment-token`, `--preview`, `--table-name`, `--table-id`, `--sheet`, `--field-mappings`, `--source-column-map`, `--no-poll` |
| `import-status` | Poll import progress (standalone) | `--table-id`, `--poll` |

### import

Thin API wrapper — handles upload, analysis, and import. All mapping/filtering decisions are the agent's job.

Three modes (pick one): `--preview`, `--table-name`, or `--table-id`.
Two input sources (pick one): `--file <path>` (local, auto-uploads) or `--attachment-token <token>`.
Execution policy: all real imports must use `--no-poll`, then run `import-status --poll` in a background task and report only final status.

```bash
# Preview file structure
teable import --file data.xlsx --preview

# Create new table (server auto-detects types)
teable import --file data.csv --table-name "Sales" --no-poll
# Then poll in background:
teable import-status --table-id <tableId-from-import> --poll

# Create new table with agent-constructed field mappings
teable import --file data.csv --table-name "Sales" --no-poll \
  --field-mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}}'
# Then poll in background:
teable import-status --table-id <tableId-from-import> --poll

# Append to existing table (agent maps field IDs to column indices)
teable import --file data.csv --table-id tblXXX --no-poll \
  --source-column-map '{"fldAAA": 0, "fldBBB": 2}'
# Then poll in background:
teable import-status --table-id tblXXX --poll
```

Options: `--sheet <name>` (Excel worksheet), `--no-header` (first row is data), `--no-poll` (don't wait).

For the full import workflow (strategy guide, agent workflows), see [data-import-guide.md](data-import-guide.md).

## AI Fill

### trigger-ai-fill
After creating/updating a field with `--ai-config`, must trigger generation:
```
--table-id tblXXX --field-id fldXXX                     # fill all records
--table-id tblXXX --field-id fldXXX --record-id recXXX  # fill one record
--table-id tblXXX --field-id fldXXX --mode emptyOnly    # fill empty cells only
```
Returns taskId — generation runs asynchronously.

## Automation Commands

For creation workflow, script API patterns, and detailed usage, see [automation-guide.md](automation-guide.md).

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-automations` | List all automations in the base | |
| `get-automation` | Get detailed workflow (trigger, actions, script code, edges) | `--workflow-id`, `--include-active-snapshot` |
| `get-automation-runs` | View run history | `--workflow-id`, `--take`, `--skip` |
| `setup-automation-trigger` | Create or update workflow + trigger | `--trigger-type`, `--table-id`, `--create-script-action` |
| `generate-script-action` | Add/update script code for an action | `--workflow-id`, `--action-id`, `--code`, `--dependencies`, `--integrations` |
| `generate-script-flowchart` | Generate flowchart for script action | `--workflow-id`, `--action-id`, `--nodes`, `--edges` (all required) |
| `test-automation-node` | Test a trigger or action node | `--workflow-id`, `--node-id`, `--side-effect`, `--record-id` |
| `activate-automation` | Activate, deactivate, or discard draft | `--workflow-id`, `--method activate\|deactivate\|discard` |
| `delete-automation-node` | Delete an action/logic node (not trigger) | `--workflow-id`, `--node-id` |

## Integrations & Advanced

| Command | Purpose |
|---------|---------|
| `connect-integration` | Open OAuth page to connect external service (e.g., Slack, Gmail) |
| `get-user-integrations` | Check if user has connected external services — use before creating automation scripts that depend on integrations |
| `execute-script` | Run JavaScript in sandbox |
| `get-script-input` | Get script input data from previous workflow actions |
| `search-api` | Search Teable APIs by description |
| `call-api` | Call any Teable API by ID (use `search-api` first) |

### connect-integration
```bash
# Open Slack OAuth page and return immediately
teable connect-integration --provider slack
# Wait for user to complete OAuth (polls until connected or timeout)
teable connect-integration --provider slack --wait --timeout 120 --interval 2
# Custom integration name
teable connect-integration --provider slack --name "Team Slack Bot"
# Connect Gmail
teable connect-integration --provider gmail --wait --timeout 120 --interval 2
```

### get-user-integrations
```bash
# Check all integrations
teable get-user-integrations
# Filter by provider
teable get-user-integrations --provider slack
# Check Gmail integration
teable get-user-integrations --provider gmail
```

### search-api + call-api

Use this pair to access any Teable API not covered by dedicated CLI commands (e.g., duplicate record, get collaborators).

**Step 1 — Find the API:**
```bash
teable search-api --query "duplicate record"
# Returns apiId, method, path, parameters
```
Options: `--tags '["record"]'` to filter by category, `--limit 10` for more results (default 5).

**Step 2 — Call it:**
```bash
teable call-api \
  --api-id "POST:/table/{tableId}/record/{recordId}/duplicate" \
  --path-params '{"tableId": "tblXXX", "recordId": "recXXX"}'
```
Options: `--query-params '{...}'` for query string, `--body '{...}'` for request body.

**Note**: `search-api` only returns GET (read-only) APIs in search results, but `call-api` can execute any method (POST/PUT/PATCH/DELETE) if you know the apiId.

## Web Scraping

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `scrape` | Extract structured data from websites into Teable tables | `--dataset-id`, `--inputs`, `--table-id` |

`--dataset-id` identifies the scraping template (platform-specific). `--inputs` is a JSON object containing the URL(s) to scrape.

```bash
# Scrape a LinkedIn profile
teable scrape --dataset-id "linkedin-profile" --inputs '{"url": "https://linkedin.com/in/example"}'
# Batch scrape Amazon products
teable scrape --dataset-id "amazon-products" --inputs '{"urls": ["https://amazon.com/dp/XXX", "https://amazon.com/dp/YYY"]}'
```

**Note:** The `--inputs` value format varies by dataset — some accept a single `url` string, others accept a `urls` array for batch operations. Run `teable get-doc --topic scrape.datasets` for the full list of supported platforms, dataset IDs, and their expected input formats.

## Documentation

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-doc` | Retrieve runtime reference documentation for a topic | `--topic` |

Use `get-doc` when you need up-to-date reference for features whose docs may change independently of the skill files.

```bash
# Get available scraping datasets
teable get-doc --topic scrape.datasets
# Get Gmail integration reference
teable get-doc --topic integration.gmail
```

Available topics: `scrape.datasets`, `integration.gmail`

## Tool Discovery

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `tools list` | List all available CLI commands | `--search` |

```bash
# List all available tools
teable tools list
# Search for tools by keyword
teable tools list --search "record"
teable tools list --search "scrape"
```
