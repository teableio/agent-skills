# Data Import Guide

> **Required**: `import --help` — three modes, three input sources, mappings format
> **Optional**: `import-status --help` — track long-running imports

## Design Philosophy

The `import` command is a **thin API wrapper**. All data analysis, field mapping decisions, column filtering, and row transformations are the **AI agent's responsibility** — `import` handles file upload and server-side processing only.

## Quick Start

```bash
# 1. Simplest import — create new table from CSV
teable import --file data.csv --table-name "Sales" --no-poll
teable import-status --table-id <tableId-from-import> --poll  # run in background

# 2. Import with field mappings — rename columns and set types
teable import --file data.csv --table-name "Sales" --no-poll \
  --field-mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}, "1": {"sourceColumn": "nm", "sourceColumnIndex": 1, "fieldName": "Name"}}'

# 3. Specific Excel worksheet
teable import --file data.xlsx --table-name "Q1" --sheet "Sheet2" --no-poll

# 4. Append to existing table (map field IDs to source column indices)
teable import --file data.csv --table-id tblXXX --no-poll \
  --source-column-map '{"fldAAA": 0, "fldBBB": 2}'
```

**fieldType values**: `text`, `long`, `number`/`num`, `date`, `checkbox`/`check`, `singleSelect`/`sel`, `multipleSelect`/`multi`, `rating`/`rate`

## Decision Flow

### Choose mode

| User wants | Command |
|---|---|
| Preview file structure | `import --file data.xlsx --preview` (returns `attachmentToken` + columns) |
| Create new table | `import --table-name "Name" --no-poll` |
| Append to existing table | `import --table-id tblXXX --no-poll` |
| Small data already parsed (≤50 records) | `record create` directly |

### Resolve file input

| File source | How |
|---|---|
| Local file | `--file /path/to/file` (auto-uploads) |
| Inline data | `--data '{"columns":[...],"rows":[...]}'` |
| Stdin | pipe into `teable import` |
| Teable URL (`.../chat-file/xxx`) | Extract last path segment → `--attachment-token xxx` |
| Already uploaded | `--attachment-token xxx` |
| External URL | Download locally first → `--file /path/to/downloaded` |

## Context Bloat Warning

**IMPORTANT**: Always use `--no-poll` with `import`. Then run `import-status --table-id tblXXX --poll` in a **background task** (`run_in_background: true`). The poll command outputs repeated JSON status lines that will flood the conversation context if run in foreground. Report only the final status (success/fail count) to the user.

## Typical Agent Workflows

### Simple import
```bash
teable import --file data.csv --table-name "Data" --no-poll
# Then poll in background (run_in_background: true):
teable import-status --table-id <tableId-from-import> --poll
```

### Import with preview (user wants specific columns/types)
```bash
# 1. Preview → returns attachmentToken + columns + detected types
teable import --file data.xlsx --preview
# 2. Agent analyzes preview output, decides mappings
# 3. Import using cached token (avoids re-upload) with --no-poll
teable import --attachment-token <token> --table-name "Sales" --field-mappings '...' --no-poll
# 4. Poll in background (run_in_background: true)
teable import-status --table-id <tableId> --poll
```

### Append to existing table
```bash
# 1. Get target fields
teable field get --table-id tblXXX
# 2. Preview source structure
teable import --file data.csv --preview
# 3. Map source columns to field IDs, import with --no-poll
teable import --attachment-token <token> --table-id tblXXX --source-column-map '{"fldAAA": 0, "fldBBB": 1}' --no-poll
# 4. Poll in background (run_in_background: true)
teable import-status --table-id tblXXX --poll
```

## Error Handling

`failedCount > 0` in import status → report `errorReportUrl` to user and ask how they want to handle it. Do NOT auto-download or auto-fix.

Use `import-status --table-id tblXXX --poll` to track long-running imports (always in background — see Context Bloat Warning above).

## Strategy Guide

| Scenario | Approach |
|----------|----------|
| Direct import, no processing | `import --file --table-name` |
| Need to control columns/types | `import` (analyze) → build mappings → `import --field-mappings` |
| Append to existing table | `field get` + `import` (analyze) → build map → `import --source-column-map` |
| Row filtering needed | Agent writes script → `import` processed file |
| Pure analysis, no import | `import` with no target flags |
