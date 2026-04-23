# Data Import Guide

Import CSV/Excel files into Teable tables using the unified `import` command.

## Design Philosophy

The `import` command is a **thin API wrapper**. It handles file upload, server-side analysis, and import — nothing more. All data analysis, field mapping decisions, column filtering, and row transformations are the **AI agent's responsibility**:

- **Structure analysis** → `import` with no target flags returns raw column info; the agent interprets it
- **Field mapping** → the agent builds `--mappings` JSON
- **Data filtering/transformation** → the agent writes scripts or local processing before importing
- **Type decisions** → the agent decides field types based on analysis + user intent

## Quick Start

```bash
# Analyze file structure (no target flags = analyze mode)
teable import --file data.xlsx

# Create new table — accept all server-detected defaults
teable import --file data.csv --table-name "Sales"

# Create new table with AI-constructed field mappings
teable import --file data.csv --table-name "Sales" \
  --mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}}'

# Append to existing table (agent maps field IDs to column indices)
teable import --file data.csv --table-id tblXXX \
  --mappings '{"fldAAA": 0, "fldBBB": 2}'

# Import inline data via --data
teable import --data '{"columns":["Name","Age"],"rows":[["Alice",30],["Bob",25]]}' --table-name "People"

# Import from stdin
cat data.csv | teable import --table-name "Piped Data"
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
| Analyze file structure | `import` (no `--table-name` or `--table-id`) |
| Create new table | `import --table-name "Name"` |
| Append to existing table | `import --table-id tblXXX` |
| Small data already parsed (≤50 structured records) | `record create` (max 2000/batch) |

### 3. Resolve file input

| File source | How |
|---|---|
| **Local file** | `--file /path/to/file` (auto-uploads) |
| **Inline data** | `--data '{"columns":[...],"rows":[...]}'` |
| **Stdin** | pipe into `teable import` |
| **Teable URL** (`.../chat-file/xxx`) | Extract last path segment → `--attachment-token xxx` |
| **Already uploaded** | `--attachment-token xxx` |
| **External URL** | Download locally first → `--file /path/to/downloaded` |

---

## Analyze Mode

```bash
teable import --file data.xlsx
```

Returns: `attachmentToken`, sheets list, columns with detected types. The `attachmentToken` can be reused in a subsequent import call to avoid re-uploading.

```bash
# After analysis, import using the cached token
teable import --attachment-token <token-from-analysis> --table-name "My Table"
```

---

## New Table Import

```bash
# Simplest — accept all server-detected defaults
teable import --file data.csv --table-name "Sales"

# With AI-constructed field mappings (rename, retype, skip columns)
teable import --file data.csv --table-name "Sales" \
  --mappings '{"0": {"sourceColumn": "amt", "sourceColumnIndex": 0, "fieldName": "Amount", "fieldType": "number"}, "1": {"sourceColumn": "nm", "sourceColumnIndex": 1, "fieldName": "Name"}}'

# Specific Excel worksheet
teable import --file data.xlsx --table-name "Q1" --sheet "Sheet2"
```

The `--mappings` JSON lets the agent fully control which columns to include, their names, types, and order. Omitted source columns are skipped.

**fieldType values**: `text`, `long`, `number`/`num`, `date`, `checkbox`/`check`, `singleSelect`/`sel`, `multipleSelect`/`multi`, `rating`/`rate`

---

## Existing Table Import

```bash
# With explicit field-to-column mapping (required)
teable import --file data.csv --table-id tblXXX \
  --mappings '{"fldAAA": 0, "fldBBB": 2, "fldCCC": null}'
```

The `--mappings` maps field IDs to source column indices (0-based) when appending to an existing table. Set a field to `null` to skip it. The agent should use `field get` to get field IDs, then `import` (analyze mode) to see source columns, and construct the mapping.

---

## Typical Agent Workflow

### Simple import (user says "import this CSV")
```bash
# Step 1: Import
teable import --file data.csv --table-name "Data"
# Step 2: Report result to user
```

### Import with analysis (user wants specific columns/types)
```bash
# 1. Analyze to see structure
teable import --file data.xlsx
# 2. Agent analyzes output, decides mappings
# 3. Import with constructed mappings
teable import --attachment-token <token> --table-name "Sales" \
  --mappings '...'
```

### Append to existing table
```bash
# 1. Get target table fields
teable field get --table-id tblXXX
# 2. Analyze file structure
teable import --file data.csv
# 3. Agent maps source columns to field IDs
teable import --attachment-token <token> --table-id tblXXX \
  --mappings '{"fldAAA": 0, "fldBBB": 1}'
```

### Large file with filtering needed
The agent writes a script to preprocess the file, then imports the result:
```bash
# 1. Agent writes filtering/transformation script
# 2. Execute locally
# 3. Import the processed file
teable import --file filtered.csv --table-name "Filtered Data"
```

---

## Error Handling

`failedCount > 0` in import status → report `errorReportUrl` to user and ask how they want to handle it. Do NOT auto-download or auto-fix.

If `failedCount = 0`, report concise success metrics (imported/updated/skipped counts).

## Strategy Guide

| Scenario | Approach |
|----------|----------|
| Direct import, no processing | `import --file --table-name` |
| Need to control columns/types | `import` (analyze) → build mappings → `import --mappings` |
| Append to existing table | `field get` + `import` (analyze) → build map → `import --mappings` |
| Row filtering needed | Agent writes script → `import` processed file |
| Pure analysis, no import | `import` with no target flags (1 call) |
