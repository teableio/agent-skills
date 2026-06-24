# Data Import Guide

## Quick Start

```bash
# 1. Simplest import — create new table from CSV
teable import --file data.csv --table-name "Sales"

# 2. Import with mappings — rename columns and set types
teable import --file data.csv --table-name "Sales" \
  --mappings '[{"sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}, {"sourceColumnIndex": 1, "fieldName": "Name"}]'

# 3. Specific Excel worksheet
teable import --file data.xlsx --table-name "Q1" --sheet "Sheet2"

# 4. Append to existing table (map source columns to field IDs)
teable import --file data.csv --table-id tblXXX \
  --mappings '[{"sourceColumnIndex": 0, "fieldId": "fldAAA"}, {"sourceColumnIndex": 2, "fieldId": "fldBBB"}]'

# 5. Inline data (JSON array of objects)
teable import --table-name "Sales" --data '[{"Name":"Alice","Amount":100},{"Name":"Bob","Amount":200}]'

# 6. Stdin pipe (CSV)
cat data.csv | teable import --table-name "Sales"

# 7. Raw CSV without header row
teable import --file data.csv --table-name "Sales" --no-header
```

**fieldType values**: `text`, `long`, `number`/`num`, `date`, `checkbox`/`check`, `singleSelect`/`sel`, `multipleSelect`/`mul`, `rating`/`rate`

## Import from Airtable

`teable import-airtable` migrates a **whole Airtable base** — tables, fields, links, views, records, and attachments — via the native importer. Unlike the row-level [`import`](#quick-start) command (which loads tabular files into a table), this creates a **new base** by default (or targets an existing one with `--base-id`).

**Credential**: automatic when Airtable is connected via `integration connect --provider airtable` — the connected integration's token is resolved and refreshed server-side, so nothing needs to be pasted. Override with `--integration-id <id>` or `--access-token <pat>`.

**Flow:**

```bash
# 1. List accessible Airtable bases
teable import-airtable --analyze

# 2. Inspect one base's schema
teable import-airtable --analyze --airtable-base-id appXXXX

# 3. Run the import into a NEW base
teable import-airtable --space-id spcXXXX --airtable-base-id appXXXX --base-name "My Base"

# 3b. Or import into an EXISTING base (no --space-id / --base-name needed)
teable import-airtable --base-id bseXXXX --airtable-base-id appXXXX
```

**Flags:**

| Flag | Notes |
|------|-------|
| `--analyze` | List bases (alone) or summarize one base's schema (with `--airtable-base-id`) |
| `--space-id` | Target space for the new base (required unless `--base-id` is set) |
| `--airtable-base-id` | Airtable base id (`appXXXX`) — required for import |
| `--base-name` | Name for the new base (required unless `--base-id` is set) |
| `--base-id` | Import into this existing base instead of creating one |
| `--no-import-records` | Import structure only, skip record data |
| `--no-import-attachments` | Skip downloading/re-uploading attachments |
| `--import-view-config` | Import view filters/sorts/grouping — **requires** `--share-link` |
| `--share-link` | Public Airtable shared-base URL (for view config import) |

## Decision Flow

### Choose mode

| User wants | Command |
|---|---|
| Analyze file structure (no import) | `import --file data.xlsx` (omit both `--table-name` and `--table-id`) |
| Create new table | `import --table-name "Name"` |
| Append to existing table | `import --table-id tblXXX` |
| Small data already parsed (≤50 records) | `record create` directly |

### Resolve file input

| File source | How |
|---|---|
| Local file | `--file /path/to/file` (auto-uploads) |
| Inline data | `--data '[{"col":"val"}, ...]'` (JSON array of objects) or raw CSV string |
| Stdin | pipe into `teable import` (CSV or JSON) |
| Teable URL (`.../chat-file/xxx`) | Extract last path segment → `--attachment-token xxx` |
| Already uploaded | `--attachment-token xxx` |
| External URL | Download locally first → `--file /path/to/downloaded` |

## Context Bloat Warning

`import-status --poll` outputs repeated JSON status lines on each polling tick. Running it in the foreground floods the conversation context with duplicate data and degrades subsequent reasoning. Always run it with `run_in_background: true` and report only the final summary (success/fail count) to the user.

## Typical Agent Workflows

### Simple import
```bash
teable import --file data.csv --table-name "Data"
# For large files, poll in background (run_in_background: true):
teable import-status --table-id <tableId-from-import> --poll
```

### Import with analysis (user wants specific columns/types)
```bash
# 1. Analyze → returns attachmentToken + columns + detected types
teable import --file data.xlsx
# 2. Agent analyzes output, decides mappings
# 3. Import using cached token (avoids re-upload)
teable import --attachment-token <token> --table-name "Sales" --mappings '[...]'
# 4. For large files, poll in background (run_in_background: true)
teable import-status --table-id <tableId> --poll
```

### Append to existing table
```bash
# 1. Get target fields
teable field get --table-id tblXXX
# 2. Analyze source structure
teable import --file data.csv
# 3. Map source columns to field IDs
teable import --attachment-token <token> --table-id tblXXX --mappings '[{"sourceColumnIndex": 0, "fieldId": "fldAAA"}, {"sourceColumnIndex": 1, "fieldId": "fldBBB"}]'
# 4. For large files, poll in background (run_in_background: true)
teable import-status --table-id tblXXX --poll
```

## Error Handling

`failedCount > 0` in import status → report `errorReportUrl` to user and ask how they want to handle it. Do not auto-download or auto-fix.

## Strategy Guide

| Scenario | Approach |
|----------|----------|
| Direct import, no processing | `import --file --table-name` |
| Need to control columns/types | `import` (analyze) → build mappings → `import --mappings` |
| Append to existing table | `field get` + `import` (analyze) → build map → `import --mappings` with `fieldId` |
| Row filtering needed | Agent writes script → `import` processed file |
| Pure analysis, no import | `import` with no target flags (omit `--table-name` and `--table-id`) |
