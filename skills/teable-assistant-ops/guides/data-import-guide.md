# Data Import Guide

Import CSV/Excel files into Teable tables using the unified `import` command.

## Design Philosophy

The `import` command is a **thin API wrapper**. It handles file upload, server-side analysis, and import — nothing more. All data analysis, field mapping decisions, column filtering, and row transformations are the **AI agent's responsibility**:

- **Structure analysis** → `import --preview` returns raw column info; the agent interprets it
- **Field mapping** → the agent builds `--field-mappings` or `--source-column-map` JSON
- **Data filtering/transformation** → the agent writes scripts (e.g., `execute-script` or local processing) before importing
- **Type decisions** → the agent decides field types based on preview + user intent

## Quick Start

```bash
# Preview file structure (returns columns, types, sheets)
teable import --file data.xlsx --preview

# Create new table — always use --no-poll, then poll in background
teable import --file data.csv --table-name "Sales" --no-poll
# Then poll separately (run this in background to avoid context bloat):
teable import-status --table-id tblXXX --poll

# Create new table with AI-constructed field mappings
teable import --file data.csv --table-name "Sales" --no-poll \
  --field-mappings '{"col1": {"sourceColumn": "Amount", "sourceColumnIndex": 0, "fieldName": "Total Amount", "fieldType": "number"}}'
# Then poll separately:
teable import-status --table-id <tableId-from-import> --poll

# Append to existing table (requires source-column-map)
teable import --file data.csv --table-id tblXXX --no-poll \
  --source-column-map '{"fldAAA": 0, "fldBBB": 2}'
# Then poll separately:
teable import-status --table-id tblXXX --poll
```

## Decision Flow

### 1. Resolve base ID

1. User provided explicitly → use it
2. Earlier command used one → reuse it
3. Omit → CLI uses configured default
4. Command fails → ask user

### 2. Choose mode

| User wants | Command |
|---|---|
| Preview file structure | `import --preview` |
| Create new table | `import --table-name "Name"` |
| Append to existing table | `import --table-id tblXXX` |
| Small data already parsed | `create-records` (max 1000/batch) |

### 3. Resolve file input

| File source | How |
|---|---|
| **Local file** | `--file /path/to/file` (auto-uploads) |
| **Teable URL** (`.../chat-file/xxx`) | Extract last path segment → `--attachment-token xxx` |
| **Already uploaded** | `--attachment-token xxx` |
| **External URL** | Download locally first → `--file /path/to/downloaded` |

---

## Preview Mode

```bash
teable import --file data.xlsx --preview
```

Returns: `attachmentToken`, sheets list, columns with detected types. The `attachmentToken` can be reused in a subsequent import call to avoid re-uploading.

```bash
# After preview, import using the cached token
teable import --attachment-token <token-from-preview> --table-name "My Table" --no-poll
# Then poll in background:
teable import-status --table-id <tableId-from-import> --poll
```

---

## New Table Import

```bash
# Simplest — accept all server-detected defaults
teable import --file data.csv --table-name "Sales" --no-poll

# With AI-constructed field mappings (rename, retype, skip columns)
teable import --file data.csv --table-name "Sales" --no-poll \
  --field-mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}, "1": {"sourceColumn": "nm", "sourceColumnIndex": 1, "fieldName": "Name"}}'

# Specific Excel worksheet
teable import --file data.xlsx --table-name "Q1" --sheet "Sheet2" --no-poll

# Poll in background after each real import:
teable import-status --table-id <tableId-from-import> --poll
```

The `--field-mappings` JSON lets the agent fully control which columns to include, their names, types, and order. Omitted source columns are skipped.

**fieldType values**: `text`, `long`, `number`/`num`, `date`, `checkbox`/`check`, `singleSelect`/`sel`, `multipleSelect`/`multi`, `rating`/`rate`

---

## Existing Table Import

```bash
# With explicit field-to-column mapping (required)
teable import --file data.csv --table-id tblXXX --no-poll \
  --source-column-map '{"fldAAA": 0, "fldBBB": 2, "fldCCC": null}'
# Then poll in background:
teable import-status --table-id tblXXX --poll
```

The `--source-column-map` maps field IDs to source column indices (0-based). Set a field to `null` to skip it. The agent should use `get-fields` to get field IDs, then `import --preview` to see source columns, and construct the mapping.

---

## Typical Agent Workflow

**IMPORTANT — Avoid context bloat**: Always use `--no-poll` with `import`. Then run `import-status --table-id tblXXX --poll` in a **background task** (`run_in_background: true`). The poll command outputs repeated JSON status lines that will flood the conversation context if run in foreground. When the background task completes, report only the final status (success/fail count) to the user.

### Simple import (user says "import this CSV")
```bash
# Step 1: Import with --no-poll
teable import --file data.csv --table-name "Data" --no-poll
# Step 2: Poll in background (run_in_background: true)
teable import-status --table-id <tableId-from-step1> --poll
# Step 3: When background task completes, report final status to user
```

### Import with analysis (user wants specific columns/types)
```bash
# 1. Preview to see structure
teable import --file data.xlsx --preview
# 2. Agent analyzes preview output, decides mappings
# 3. Import with constructed mappings (--no-poll)
teable import --attachment-token <token> --table-name "Sales" --no-poll \
  --field-mappings '...'
# 4. Poll in background
teable import-status --table-id <tableId> --poll
```

### Append to existing table
```bash
# 1. Get target table fields
teable get-fields --table-id tblXXX
# 2. Preview file structure
teable import --file data.csv --preview
# 3. Agent maps source columns to field IDs (--no-poll)
teable import --attachment-token <token> --table-id tblXXX --no-poll \
  --source-column-map '{"fldAAA": 0, "fldBBB": 1}'
# 4. Poll in background
teable import-status --table-id tblXXX --poll
```

### Large file with filtering needed
The agent writes a script to preprocess the file, then imports the result:
```bash
# 1. Agent writes filtering/transformation script
# 2. Execute locally or via execute-script
# 3. Import the processed file (--no-poll)
teable import --file filtered.csv --table-name "Filtered Data" --no-poll
# 4. Poll in background
teable import-status --table-id <tableId> --poll
```

---

## Error Handling

`failedCount > 0` in import status → report `errorReportUrl` to user and ask how they want to handle it. Do NOT auto-download or auto-fix.

If `failedCount = 0`, report concise success metrics (imported/updated/skipped counts) and stop polling.

## Strategy Guide

| Scenario | Approach |
|----------|----------|
| Direct import, no processing | `import --file --table-name --no-poll` → background `import-status --poll` |
| Need to control columns/types | `import --preview` → build mappings → `import --field-mappings --no-poll` → background poll |
| Append to existing table | `get-fields` + `import --preview` → build map → `import --source-column-map --no-poll` → background poll |
| Row filtering needed | Agent writes script → `import --no-poll` processed file → background poll |
| Pure analysis, no import | `import --preview` (1 call) |
