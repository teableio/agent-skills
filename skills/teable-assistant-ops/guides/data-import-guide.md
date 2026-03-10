# Data Import Guide

Import local CSV/Excel files into Teable tables.

## Overview

When the user wants to import a file into Teable, use the CLI pipeline: `upload-attachment` -> `import-excel` -> verify.

For pure analysis (no Teable import), just process the file locally with your own tools — no Teable APIs needed.

## Import Flow

```
Local file (CSV/Excel)
  -> upload-attachment (get attachment token)
  -> import-excel --stage import (create table with field mappings)
  -> Poll status until complete
  -> Report result to user
```

### Step 1: Upload

```bash
teable upload-attachment --file-path /absolute/path/to/file.csv
```

Returns an attachment token for the next step.

### Step 2: Import

Skip the analyze stage — profile the file yourself locally to decide field types, then import directly.

```bash
teable import-excel \
  --stage import \
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

Import runs asynchronously. Poll via `GET /api/import/status/:tableId` (tableId from import response).

Response: `status` (pending/running/completed/failed), `successCount`, `failedCount`, `errorReportUrl`.

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

## Error Handling

When `failedCount > 0`, download the error report CSV from `errorReportUrl`. It contains failed rows with an `__error` column.

To re-import fixed rows into the **same existing table**, use inplace import:

```bash
# 1. Fix the data, remove __error column
# 2. Upload fixed CSV
teable upload-attachment --file-path /tmp/fixed_rows.csv

# 3. Get field IDs for sourceColumnMap
teable get-fields --table-id <tableId>

# 4. Inplace import (API, no CLI command)
curl -X PATCH "${TEABLE_HOST}/api/import/${BASE_ID}/${TABLE_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachmentUrl": "<presignedUrl>",
    "fileType": "csv",
    "insertConfig": {
      "sourceWorkSheetKey": "Import Table",
      "excludeFirstRow": true,
      "sourceColumnMap": {"fldXXX": 0, "fldYYY": 1}
    }
  }'
```

## Large Files (>4GB)

S3 single PUT limit is 5GB. For files approaching this limit, split the CSV before uploading:

- First chunk: `import-excel --stage import` (creates the table)
- Subsequent chunks: inplace import API (appends to the same table)
- Use the same field mappings for all chunks
