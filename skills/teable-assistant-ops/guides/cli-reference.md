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
  - [View Management](#view-management)
  - [SQL Query](#sql-query)
    - [Critical rules:](#critical-rules)
    - [System fields (always available):](#system-fields-always-available)
  - [Import / Export](#import--export)
    - [import-excel](#import-excel)
    - [upload-attachment](#upload-attachment)
  - [AI Fill](#ai-fill)
    - [trigger-ai-fill](#trigger-ai-fill)
  - [Integrations \& Advanced](#integrations--advanced)

## Global Options

Most commands accept `--base-id <baseId>`, but it can be omitted if a default base is configured via `teable config`. Auth is resolved from config or `--token` / `TEABLE_TOKEN`. For a full list of which commands accept `--base-id`, see [base-id-reference.md](base-id-reference.md).

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
| User | `{"id":"usrXXX","title":"Name"}` | `{"id":"usrXXX","title":"Alice"}` |
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

## Import / Export

### import-excel
Two-stage process:
1. **Analyze**: `--stage analyze --attachment-token <token>` → returns structure + suggestedFieldMappings
2. **Import**: `--stage import --table-name "..." --field-mappings '<from_analyze>' --worksheet-key '<from_analyze>'`

Note: For CSV files, worksheet-key is `"Import Table"`, not `"0"`.

First upload the file with `upload-attachment`, then use the returned token.

### upload-attachment
Upload local files: `--file-path /path/to/file.csv` (must be absolute path)

## AI Fill

### trigger-ai-fill
After creating/updating a field with `--ai-config`, must trigger generation:
```
--table-id tblXXX --field-id fldXXX                     # fill all records
--table-id tblXXX --field-id fldXXX --record-id recXXX  # fill one record
--table-id tblXXX --field-id fldXXX --mode emptyOnly    # fill empty cells only
```
Returns taskId — generation runs asynchronously.

## Integrations & Advanced

| Command | Purpose |
|---------|---------|
| `connect-integration` | Connect to Slack |
| `get-user-integrations` | List connected integrations |
| `execute-script` | Run JavaScript in sandbox |
| `get-script-input` | Get script input data from previous workflow actions |
| `search-api` | Search Teable APIs by description |
| `call-api` | Call any Teable API by ID (use `search-api` first) |

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
