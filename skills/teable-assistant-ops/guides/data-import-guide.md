# Data Import Guide

## Quick Start

Use `import file` for tabular files/inline data and `import airtable` / `import google-sheet` for native migrations. Analyze before choosing sheets or mappings; reuse the returned attachment token to avoid another upload. Existing-table imports **append only**, never update or upsert: inspect the target first and do not retry an uncertain submission blindly, or rows may be duplicated.

```bash
# 1. Simplest import — create new table from CSV
teable import file --file data.csv --table-name "Sales"

# 2. Import with mappings — rename columns and set types (new-table mode: ARRAY;
#    "column" = source column name, optional — entries default to positional order)
teable import file --file data.csv --table-name "Sales" \
  --mappings '[{"column": "amt", "field": "Amount", "type": "number"}, {"column": "name", "field": "Name"}]'

# 3. Specific Excel worksheet
teable import file --file data.xlsx --table-name "Q1" --sheet "Sheet2"

# 4. Append to existing table (append mode: OBJECT, not array —
#    key = field ID or field name, value = 0-based source column index, null = skip)
teable import file --file data.csv --table-id tblXXX \
  --mappings '{"fldAAA": 0, "fldBBB": 2}'

# 5. Inline data (JSON array of objects)
teable import file --table-name "Sales" --data '[{"Name":"Alice","Amount":100},{"Name":"Bob","Amount":200}]'

# 6. Stdin pipe (CSV)
cat data.csv | teable import file --table-name "Sales"

# 7. Raw CSV without header row
teable import file --file data.csv --table-name "Sales" --no-header

# 8. Create the new table inside a project folder (only with --table-name)
teable import file --file data.csv --table-name "Sales" --folder-id <folderNodeId>
```

**`--mappings` shape differs by mode** — new table (`--table-name`) takes an **array** of `{column?, field, type?}`; append (`--table-id`) takes an **object** `{"<field ID or name>": <0-based column index>}` (arrays are rejected; omit `--mappings` entirely to auto-match by header name).

**`type` values** (new-table mappings): `text`/`singleLineText`, `long`/`longText`, `num`/`number`, `check`/`checkbox`, `date`, `sel`/`singleSelect`, `multi`/`multipleSelect`, `rate`/`rating` — note `multi`, NOT `mul` (that alias only exists in `table create --fields` shorthand)

**File formats**: `.csv`, `.tsv`, `.xlsx`, `.xlsm`, `.xls`

## Import from Airtable

`teable import airtable` migrates a **whole Airtable base** — tables, fields, links, views, records, and attachments — via the native importer. Unlike the row-level [`import file`](#quick-start) command (which loads tabular files into a table), this creates a **new project** by default (or targets an existing one with `--base-id`).

**Credential**: automatic when the user has connected Airtable via the connectors UI — the connected integration's token is auto-detected and refreshed server-side, so nothing needs to be pasted. Override with `--integration-id <id>`, `--access-token <pat>`, or the `AIRTABLE_TOKEN` env var. Connect missing accounts with `integration connect --provider airtable`; see [Integration Guide](integration-guide.md).

**Flow:**

```bash
# 1. List accessible Airtable bases
teable import airtable --analyze

# 2. Inspect one base's schema
teable import airtable --analyze --airtable-base-id appXXXX

# 3. Run the import into a NEW project
teable import airtable --space-id spcXXXX --airtable-base-id appXXXX --base-name "My Project"

# 3b. Or import into an EXISTING project (no --space-id / --base-name needed)
teable import airtable --base-id bseXXXX --airtable-base-id appXXXX
```

**Flags:**

| Flag | Notes |
|------|-------|
| `--analyze` | List bases (alone) or summarize one base's schema (with `--airtable-base-id`) |
| `--space-id` | Target space for the new project (required unless `--base-id` is set) |
| `--airtable-base-id` | Airtable base id (`appXXXX`) — required for import |
| `--base-name` | Name for the new project (required unless `--base-id` is set) |
| `--base-id` | Import into this existing project instead of creating one |
| `--folder-id` | Place the imported tables under this project folder (only with `--base-id`) |
| `--no-import-records` | Import structure only, skip record data |
| `--no-import-attachments` | Skip downloading/re-uploading attachments |
| `--import-view-config` | Import view filters/sorts/grouping — **requires** `--share-link` |
| `--share-link` | Public Airtable shared-base URL (for view config import) |

## Import from Google Sheets

`teable import google-sheet` uses the native importer; each selected worksheet becomes a table. Import into an existing project when one is already the target, otherwise provide a space and project name to create a new project.

**Credential decision:** publicly shared spreadsheets need none. Otherwise the connected Google Sheets integration is resolved and refreshed automatically. Its `drive.file` scope can read only spreadsheets the user selected in Teable's **Import from Google Sheets** dialog; a 403/404 usually means the user must select that spreadsheet there once. Use an integration ID only to disambiguate connections, and a Google access token only as an explicit override.

**Workflow:**

1. Analyze the spreadsheet first when tab selection matters; retain the numeric sheet IDs from the result.
2. Import all tabs by default, or pass the chosen IDs as one comma-separated value.
3. Decide between an existing project and a new project before importing. Structure-only migration is available when records should be skipped.

A spreadsheet ID or its full `docs.google.com/spreadsheets` URL is accepted. This command imports worksheet data and structure; use `import file` instead for local CSV/Excel files.

## Decision Flow

### Choose mode

| User wants | Command |
|---|---|
| Analyze file structure (no import) | `import file --file data.xlsx` (omit both `--table-name` and `--table-id`) |
| Create new table | `import file --table-name "Name"` |
| Append to existing table | `import file --table-id tblXXX` |
| Small data already parsed (≤50 records) | `record create` directly |
| Row filtering/transformation before import | Agent processes the file locally first → `import file` the processed file |
| Google spreadsheet, one table per selected tab | `import google-sheet` |

### Resolve file input

| File source | How |
|---|---|
| Local file | `--file /path/to/file` (auto-uploads) |
| Inline data | `--data '[{"col":"val"}, ...]'` (JSON array of objects) or raw CSV string |
| Stdin | pipe into `teable import file` (CSV or JSON) |
| Teable URL (`.../chat-file/xxx`) | Extract last path segment → `--attachment-token xxx` |
| Already uploaded | `--attachment-token xxx` |
| External URL | Download locally first → `--file /path/to/downloaded` |

## Context Bloat Warning

`import status --poll` outputs repeated JSON status lines on each polling tick. Running it in the foreground floods the conversation context with duplicate data and degrades subsequent reasoning. Always run it with `run_in_background: true` and report only the final summary (success/fail count) to the user.

## Typical Agent Workflows

### Simple import
```bash
teable import file --file data.csv --table-name "Data"
# For large files, poll in background (run_in_background: true):
teable import status --table-id <tableId-from-import> --poll
```

### Import with analysis (user wants specific columns/types)
```bash
# 1. Analyze → returns attachmentToken + columns + detected types
teable import file --file data.xlsx
# 2. Agent analyzes output, decides mappings
# 3. Import using cached token (avoids re-upload)
teable import file --attachment-token <token> --table-name "Sales" --mappings '[...]'
# 4. For large files, poll in background (run_in_background: true)
teable import status --table-id <tableId> --poll
```

### Append to existing table
```bash
# 1. Get target fields
teable field get --table-id tblXXX
# 2. Analyze source structure
teable import file --file data.csv
# 3. Map field IDs (or names) to 0-based source column indexes (object, not array)
teable import file --attachment-token <token> --table-id tblXXX --mappings '{"fldAAA": 0, "fldBBB": 1}'
# 4. For large files, poll in background (run_in_background: true)
teable import status --table-id tblXXX --poll
```

## Error Handling

`failedCount > 0` in import status → report `errorReportUrl` to user and ask how they want to handle it. Do not auto-download or auto-fix.
