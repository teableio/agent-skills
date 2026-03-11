# Data Import Guide

Import CSV/Excel files into Teable tables.

## Overview

Use the CLI pipeline: `upload-attachment` -> `import-excel` -> `import-status --poll` -> verify.

If the file is not local, download it first.

For pure analysis (no Teable import), just process the file with your own tools — no Teable APIs needed.

## Import Flow

```
CSV/Excel file (download first if needed)
  -> upload-attachment (get attachment token)
  -> import-excel (create table with field mappings)
  -> import-status --poll (wait for completion)
  -> Report result to user
```

### Step 1: Upload

```bash
teable upload-attachment --file-path /absolute/path/to/file.csv
```

Returns an attachment token for the next step.

### Step 2: Import

Profile the file yourself locally to decide field types, then import directly.

```bash
teable import-excel \
  --attachment-token <token> \
  --table-name "My Table" \
  --worksheet-key "Import Table" \
  --field-mappings '[
    {"sourceColumnIndex": 0, "name": "Name", "type": "singleLineText"},
    {"sourceColumnIndex": 1, "name": "Amount", "type": "number"},
    {"sourceColumnIndex": 2, "name": "Date", "type": "date"}
  ]'
```

**Field mappings format**: JSON array with `sourceColumnIndex`, `name`, `type`. NOT an object.

**Worksheet key**: Use `"Import Table"` for CSV files.

**Common field types**: `singleLineText`, `longText`, `number`, `date`, `checkbox`, `singleSelect`, `multipleSelect`, `rating`

### Step 3: Poll Status

Import runs asynchronously. Use the CLI to poll until completion:

```bash
teable import-status --table-id <tableId> --poll
```

The `--poll` flag continuously polls (default 5s interval) until the import completes or fails.

Returns: `status` (pending/running/completed/failed/not_found), `successCount`, `failedCount`, `errorReportUrl`.

Show progress to user during polling. Report final result with success/failed counts.

## Excel Files

Excel files should be converted to CSV locally before upload. Server-side Excel import has a 5MB limit. Use openpyxl streaming for conversion (O(1) memory):

```python
import openpyxl, csv
wb = openpyxl.load_workbook('file.xlsx', read_only=True)
ws = wb[wb.sheetnames[0]]
with open('/tmp/output.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    for row in ws.iter_rows(values_only=True):
        writer.writerow(row)
wb.close()
```

## Inplace Import (Append to Existing Table)

To import data into an **existing table** (e.g., re-importing fixed error rows, appending chunks):

```bash
# 1. Upload the CSV
teable upload-attachment --file-path /tmp/data.csv

# 2. Get field IDs for source-column-map
teable get-fields --table-id <tableId>

# 3. Inplace import
teable inplace-import \
  --table-id <tableId> \
  --attachment-token <token> \
  --source-column-map '{"fldXXX": 0, "fldYYY": 1}'

# 4. Poll status
teable import-status --table-id <tableId> --poll
```

**source-column-map**: JSON object mapping field IDs to source column indices (0-based).

## Error Handling

When `failedCount > 0`, download the error report CSV from `errorReportUrl`. It contains failed rows with an `__error` column.

Fix the data, remove the `__error` column, then use inplace import (see above) to re-import the fixed rows into the same table.

## Large Files (>4GB)

S3 single PUT limit is 5GB. For files approaching this limit, split the CSV before uploading:

- First chunk: `import-excel` (creates the table)
- Subsequent chunks: `inplace-import` (appends to the same table)
- Use the same field mappings for all chunks
