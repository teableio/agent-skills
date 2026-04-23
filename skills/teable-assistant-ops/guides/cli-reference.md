# CLI Command Reference

Run `teable <command> --help` for full options of any command.

## Table of Contents
- [CLI Command Reference](#cli-command-reference)
  - [Table of Contents](#table-of-contents)
  - [Global Options](#global-options)
  - [Data Query Commands](#data-query-commands)
    - [record get notes](#record-get-notes)
  - [Field Management](#field-management)
    - [field create](#field-create)
    - [field update / field delete](#field-update--field-delete)
  - [Record Management](#record-management)
    - [record create](#record-create)
    - [record update](#record-update)
    - [record delete](#record-delete)
  - [Table Management](#table-management)
    - [table create](#table-create)
    - [table update / table delete](#table-update--table-delete)
  - [Node \& Folder Management](#node--folder-management)
    - [get-node-tree](#get-node-tree)
    - [folder create](#folder-create)
    - [folder rename / folder delete](#folder-rename--folder-delete)
    - [folder move](#folder-move)
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
    - [integration connect](#integration-connect)
    - [integration list](#integration-list)
    - [integration get-token](#integration-get-token)
    - [search-api + call-api](#search-api--call-api)
  - [Web Scraping](#web-scraping)
  - [Documentation](#documentation)
  - [Tool Discovery](#tool-discovery)

## Global Options

Most commands accept `--base-id <baseId>`, but it can be omitted if a default base is configured via `teable config`. Auth is resolved from config or `--token` / `TEABLE_TOKEN`. For a full list of which commands accept `--base-id`, see [base-id-reference.md](base-id-reference.md).

Use `teable config show` to check current config (endpoint, baseId, token status) when troubleshooting.

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `record get --search "keyword"` | Plain string auto-wraps to `{"value":"keyword"}`; for field-scoped search: `--search '{"value":"keyword","fieldId":"fldXXX"}'` |
| `record create --records '[{"fields":{...}}]'` | Object format auto-converts; canonical form: `--header '[...]' --records '[[...]]'` |
| `record update --records '[{"id":"recXXX","fields":{...}}]'` | Object format auto-converts; canonical form: `--header '["recordId",...]' --records '[["recXXX",...]]'` |
| `field update --name "X"` | `--name` convenience flag works; for other properties use `--updates '{"name":"X"}'` |
| `table create --fields '[{"name":"X","type":"singleLineText"}]'` | Object format auto-converts; canonical shorthand: `--fields '["X:text"]'` |

## Data Query Commands

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `table get` | List tables (returns tableId, dbTableName) | |
| `field get` | Field definitions (returns fieldId, dbFieldName, type) | `--table-id` |
| `record get` | Query records with pagination | `--table-id`, `--take`, `--skip`, `--search`, `--projection`, `--record-id`, `--limit`, `--view-id` |
| `view get` | List views in a table | `--table-id` |

### record get notes
- Default 100 records, max 1000
- Without `--projection`, only first 20 fields returned; use `--projection '["all"]'` for all (max 50)
- Search: `--search "keyword"` auto-wraps to `{"value":"keyword"}`; for field-scoped search: `--search '{"value":"keyword","fieldId":"fldXXX"}'`
- Get single record: `--record-id recXXX`
- `--limit` is an alias for `--take`
- `--view-id viwXXX` — returns rows in view order with view's filter/sort/group applied; group headers excluded. Use for positional references ("the 3rd row in this view")

## Field Management

### field create
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

### field update / field delete
- `field update --table-id tblXXX --field-id fldXXX --name "New Name" --type num`
- `field update --table-id tblXXX --field-id fldXXX --updates '{"name":"New Name","description":"..."}'` — `--updates` for setting multiple properties; `--name` is a convenience shortcut for the common case
- `field delete --table-id tblXXX --field-id fldXXX` (permanent)

## Record Management

### record create
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

**Batch limits**: max 2000 records per call. For larger datasets, split into multiple calls.
### record update
Compact array format — header first element MUST be `"recordId"`:
```
--header '["recordId","Name","Status"]' --records '[["recAAA","Updated Name","Done"],["recBBB","","Pending"]]'
```
- `""` (empty string): skip field (no change)
- `null`: clear the cell
- Attachment: pass full array `[{name,token}]` — this **replaces** all existing attachments, not appends

**Record reordering** — use `--order` to move a record within a view:
```
record update --header '["recordId"]' --records '[["recXXX"]]' \
  --order '{"viewId":"viwXXX","anchorId":"recYYY","position":"before"}'
```

**Batch limits**: max 2000 records per call. For larger datasets, split into multiple calls.

### record delete
```
--table-id tblXXX --record-ids '["recXXX", "recYYY"]'
```

**Batch limits**: max 2000 record IDs per call. For larger datasets, split into multiple calls.

## Table Management

### table create
```
--table-name "Tasks" --fields '["Title:text","Status:sel:Todo,Done","Due:date"]' --icon "📋"
```

### table update / table delete
- `table update --table-id tblXXX --name "New Name"`
- `table delete --table-id tblXXX` (permanent)

## Node & Folder Management

Bases contain a tree of nodes — tables, folders, dashboards, apps, and workflows. Use these commands to organize them into folders and control their order.

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-node-tree` | Get full node hierarchy of a base | |
| `folder create` | Create a new folder | `--name` |
| `folder rename` | Rename a folder | `--folder-id`, `--name` |
| `folder delete` | Delete an empty folder (move children out first) | `--folder-id` |
| `folder move` | Move/reorder a node | `--node-id`, `--parent-id`, `--anchor-id`, `--position` |

### get-node-tree
Returns the tree structure of all nodes in the base — use this first to understand current organization before making changes.
```bash
teable get-node-tree
```

### folder create
```bash
teable folder create --name "Reports"
```

### folder rename / folder delete
```bash
# Rename
teable folder rename --folder-id fldXXX --name "Monthly Reports"
# Delete — folder must be empty; move children out first with folder move
teable folder delete --folder-id fldXXX
```

### folder move
Move a node (table, folder, dashboard, etc.) into a folder, out to root, or reorder within the same level.
```bash
# Move a table into a folder
teable folder move --node-id tblXXX --parent-id fldYYY
# Move to root (no parent)
teable folder move --node-id tblXXX --parent-id null
# Reorder: place node before a sibling
teable folder move --node-id tblXXX --anchor-id tblYYY --position before
# Reorder: place node after a sibling inside a folder
teable folder move --node-id tblXXX --parent-id fldYYY --anchor-id tblZZZ --position after
```

## View Management

**View types**: `grid` (default), `kanban`, `form`, `gallery`, `calendar`, `plugin`

| Command | Key Options |
|---------|-------------|
| `view create` | `--table-id`, `--name`, `--type grid\|kanban\|form\|gallery\|calendar\|plugin` |
| `view update` | `--view-id`, `--name`, filter/sort/group config |
| `view delete` | `--view-id` (permanent) |

## SQL Query

**READ-ONLY** — only SELECT statements allowed (PostgreSQL 15.4).

### Critical rules:
1. **Must use database names**: call `table get` for `dbTableName`, `field get` for `dbFieldName`
2. **Table format**: `"baseId"."dbTableName"` (e.g., `"bseXXX"."receipts"`)
3. **Double-quote all identifiers**: `SELECT "field" FROM "schema"."table"`
4. **Add LIMIT 100** for non-aggregate queries
5. **JSON fields**: `json_extract_path_text("field"::json, 'key')`

### System fields (always available):
`__id`, `__auto_number`, `__created_time`, `__last_modified_time`, `__created_by`, `__last_modified_by`, `__version`

## Data Import

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `import` | Unified import: analyze, create table, or append to existing | `--file`, `--attachment-token`, `--data`, `--table-name`, `--table-id`, `--sheet`, `--mappings` |
| `import-status` | Poll import progress (standalone) | `--table-id`, `--poll` |

### import

Thin API wrapper — handles upload, analysis, and import. All mapping/filtering decisions are the agent's job.

Three modes: no target flags (analyze), `--table-name` (create new table), or `--table-id` (append to existing).
Three input sources: `--file <path>` (local, auto-uploads), `--data <json>` (inline data), or stdin (pipe).

```bash
# Analyze file structure (no target flags)
teable import --file data.xlsx

# Create new table (server auto-detects types)
teable import --file data.csv --table-name "Sales"

# Create new table with agent-constructed field mappings
teable import --file data.csv --table-name "Sales" \
  --mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}}'

# Append to existing table (agent maps field IDs to column indices)
teable import --file data.csv --table-id tblXXX \
  --mappings '{"fldAAA": 0, "fldBBB": 2}'

# Import inline data
teable import --data '{"columns":["Name","Age"],"rows":[["Alice",30],["Bob",25]]}' --table-name "People"

# Import from stdin
cat data.csv | teable import --table-name "Piped Data"
```

Options: `--sheet <name>` (Excel worksheet), `--no-header` (first row is data).

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
| `automation list` | List all automations in the base | |
| `automation get` | Get detailed workflow (trigger, actions, script code, edges) | `--workflow-id`, `--include-active-snapshot` |
| `automation get-runs` | View run history | `--workflow-id`, `--take`, `--skip`, `--status` |
| `automation get-run` | Step-level detail of a single automation run | `--workflow-id`, `--run-id` |
| `automation setup-trigger` | Create or update workflow + trigger | `--trigger-type`, `--table-id`, `--create-script-action` |
| `automation generate-script` | Add/update script code for an action | `--workflow-id`, `--action-id`, `--code`, `--dependencies`, `--integrations` |
| `automation generate-flowchart` | Generate flowchart for script action | `--workflow-id`, `--action-id`, `--flowchart` (all required) |
| `automation test-node` | Test a trigger or action node | `--workflow-id`, `--node-id`, `--side-effect`, `--record-id` |
| `automation activate` | Activate, deactivate, or discard draft | `--workflow-id`, `--method activate\|deactivate\|discard` |
| `automation delete-node` | Delete an action/logic node (not trigger) | `--workflow-id`, `--node-id` |

## Integrations & Advanced

| Command | Purpose |
|---------|---------|
| `integration connect` | Open OAuth page to connect external service (e.g., Slack) |
| `integration list` | Check if user has connected external services — use before creating automation scripts that depend on integrations |
| `integration get-token` | Get access token for a connected integration |
| `get-collaborators` | Get base collaborators with pagination/search — use `--search` to find users by name for user field values |
| `automation get-script-input` | Get script input data from previous workflow actions |
| `search-api` | Search Teable APIs by description |
| `call-api` | Call any Teable API by method + URL (use `search-api` first) |

### integration connect
```bash
# Open Slack OAuth page and return immediately
teable integration connect --provider slack
# Wait for user to complete OAuth (polls until connected or timeout)
teable integration connect --provider slack --wait --timeout 120 --interval 2
# Custom integration name
teable integration connect --provider slack --name "Team Slack Bot"
```

### integration list
```bash
# Check all integrations
teable integration list
# Filter by provider
teable integration list --provider slack
```

### integration get-token
```bash
# Get access token for a connected integration
teable integration get-token --integration-id intXXX
```

### search-api + call-api

Use this pair to access any Teable API not covered by dedicated CLI commands (e.g., duplicate record, get collaborators).

**Step 1 — Find the API:**
```bash
teable search-api --query "duplicate record"
# Returns method, path, parameters
```
Options: `--tags '["record"]'` to filter by category, `--limit 10` for more results (default 5).

**Step 2 — Call it:**
```bash
teable call-api \
  --method POST \
  --url "/table/{tableId}/record/{recordId}/duplicate" \
  --params '{"tableId": "tblXXX", "recordId": "recXXX"}'
```
Options: `--params '{...}'` for path and query parameters, `--data '{...}'` for request body.

**Note**: `search-api` only returns GET (read-only) APIs in search results, but `call-api` can execute any method (POST/PUT/PATCH/DELETE) if you know the URL.

## Web Scraping

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `scrape` | Extract structured data from websites into Teable tables | `--dataset-id`, `--inputs`, `--table-id`, `--snapshot-id` |

`--dataset-id` identifies the scraping template (platform-specific). `--inputs` is a JSON array of objects containing the URL(s) to scrape.

```bash
# Scrape a LinkedIn profile
teable scrape --dataset-id "linkedin-profile" --inputs '[{"url": "https://linkedin.com/in/example"}]'
# Batch scrape Amazon products
teable scrape --dataset-id "amazon-products" --inputs '[{"url": "https://amazon.com/dp/XXX"}, {"url": "https://amazon.com/dp/YYY"}]'
```

**Polling mode**: For long-running scrapes, use `--snapshot-id` to poll for results:
```bash
# Start scrape (returns snapshot-id)
teable scrape --dataset-id "linkedin-profile" --inputs '[{"url": "https://linkedin.com/in/example"}]'
# Poll for results
teable scrape --dataset-id "linkedin-profile" --snapshot-id <snapshot-id-from-above>
```

**Note:** Run `teable get-doc --topic scrape.datasets` for the full list of supported platforms, dataset IDs, and their expected input formats.

## Documentation

| Command | Purpose | Key Options |
|---------|---------|-------------|
| `get-doc` | Retrieve runtime reference documentation for a topic | `--topic` |

Use `get-doc` when you need up-to-date reference for features whose docs may change independently of the skill files.

```bash
# Get available scraping datasets
teable get-doc --topic scrape.datasets
# Get AI field config reference
teable get-doc --topic field.ai
```

Available topics: `scrape.datasets`, `field.ai`

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
