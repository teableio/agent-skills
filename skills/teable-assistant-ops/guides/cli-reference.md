# CLI Operations Reference

Use `teable config show` to check current endpoint, baseId, and token status.

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `record get` defaults to all fields | Use `--projection '["fldXXX","fldYYY"]'` to select specific fields |
| `record create/update` with `{"fields":{...}}` object format | Object format auto-converts; canonical form: `--header '[...]' --records '[[...]]'` |
| `--search "keyword"` scope | Plain string auto-wraps to `{"value":"keyword"}`; for field-scoped: `--search '{"value":"keyword","fieldId":"fldXXX"}'` |
| `field update --name "X"` | `--name` is a convenience flag; for other properties use `--updates '{"name":"X"}'` |
| `table create --fields '[{...}]'` object format | Object format auto-converts; canonical shorthand: `--fields '["X:text"]'` |

## Base, Table, Field, and View Lifecycle

Use the base commands to discover and manage bases. Base creation targets a space; the other operations use a base ID:

```bash
teable base list
teable base create --space-id spcXXXX --name "My Base"
teable base get --base-id bseXXXX
teable base update --base-id bseXXXX --name "Renamed Base"
```

For resources inside a base, use the resource ID together with the base ID. Delete operations are destructive (tables move to trash; fields and views are permanent):

```bash
teable table delete --base-id bseXXXX --table-id tblXXXX
teable field delete --base-id bseXXXX --table-id tblXXXX --field-id fldXXXX
teable view delete --base-id bseXXXX --table-id tblXXXX --view-id viwXXXX
```

## Authority Matrix

The authority matrix provides advanced, role-based permissions for a base. It is
available only when the Teable deployment has the EE advanced-permissions
feature, and matrix configuration requires Base Owner/Creator access.

### Authority and role inspection

```bash
teable authority get --base-id bseXXXX
teable authority role-list --base-id bseXXXX
teable authority role-get --base-id bseXXXX --role-id aurXXXX
```

The matrix applies to collaborators except the base Owner and matrix admins.
When enabled, users assigned to roles receive the union of their grants; users
without an assigned role use the configured default role, or lose access if no
default role exists. Enable only after configuring a safe default role.

### Export, edit, and apply

Always start permission changes by exporting the declarative configuration:

```bash
teable authority export --base-id bseXXXX --file authority.json --pretty
# Edit authority.json, then preview the changes:
teable authority diff --base-id bseXXXX --file authority.json --pretty
# Apply only after reviewing the preview:
teable authority apply --base-id bseXXXX --file authority.json --dry-run --pretty
teable authority apply --base-id bseXXXX --file authority.json --pretty
```

`authority diff` previews changes without writing. `authority apply --dry-run`
uses the same preflight checks and also previews deletions requested by
`--prune`; without `--prune`, roles absent from the file are kept. Apply is not
atomic, so changes run in order and stop at the first API error. Keys absent
from the file remain unchanged. For a small, role-scoped edit, export one role
with `--role <idOrName>`; the resulting partial file manages only that role and
cannot prune:

```bash
teable authority export --base-id bseXXXX --role aurXXXX --file role.json --pretty
```

A role grants access table by table. Use the `permissions` array in the
exported JSON; each table grant has an `access` preset (`editor`, `commenter`,
or `viewer`) and may additionally specify `deny`, `views`, `rowFilter`, and
per-field restrictions. A table omitted from a role's grants is invisible to
that role's members. The matrix ceiling is platform Editor level: roles cannot
create/delete tables or fields or share views. See `teable authority export
--help` for the complete config-file shape and grant reference.

### Matrix state and destructive role operations

The matrix on/off state is not part of the exported file:

```bash
teable authority enable --base-id bseXXXX
teable authority disable --base-id bseXXXX
```

Disable keeps the role configuration and makes collaborators use their plain
base roles. Delete a role only when its members can safely fall back to the
default role; deleting the default role itself is refused:

```bash
teable authority role-delete --base-id bseXXXX --role-id aurXXXX
teable authority role-duplicate --base-id bseXXXX --role-id aurXXXX --name "Sales copy"
```

## Field Type Aliases

When creating tables or fields, use these shorthand type aliases:

| Alias | Type | Example |
|-------|------|---------|
| `text` | Single-line text | `"Title:text"` |
| `long` | Long text (rich text) | `"Notes:long"` |
| `num` | Number | `"Amount:num"` |
| `date` | Date | `"Due:date"` |
| `check` | Checkbox | `"Done:check"` |
| `rate` | Rating | `"Score:rate"` |
| `user` | User | `"Assignee:user"` |
| `file` | Attachment | `"Files:file"` |
| `auto` | Auto-number | `"ID:auto"` |
| `created` | Created time | `"Created:created"` |
| `modified` | Last modified time | `"Modified:modified"` |
| `sel:A,B,C` | Single select | `"Status:sel:Todo,Done"` |
| `mul:A,B,C` | Multi-select | `"Tags:mul:Bug,Feature"` |

Advanced types (link, lookup, rollup, formula, AI) require `field create` with options — see [field.simple.md](../api-reference/field.simple.md).

**Name resolution**: `field create` accepts table/field names in place of IDs (e.g., `foreignTableName: "Projects"` instead of `foreignTableId: "tblXXX"`). This reduces the need to look up IDs before creating link/lookup/rollup fields.

## Data Queries

**`record get` vs `sql-query`** — if you'll write back to the same records, use `record get` (returns record IDs); for analytics or cross-table reads, use `sql-query`.

- **record get** — record IDs for subsequent writes, `--search` for fuzzy search, simple pagination. Returns structured records with `recordId`.
- **sql-query** — JOINs across tables, aggregations (COUNT/SUM/AVG/GROUP BY), complex WHERE, subqueries. Returns flat rows without record IDs. Read-only (SELECT only).
- **Aggregation**: prefer `sql-query` with GROUP BY. Alternatively, `search-api --query "aggregation"` + `call-api` for the dedicated aggregation endpoint.

```bash
# record get defaults to all fields; use --projection to select specific ones
teable record get --table-id tblXXX --projection '["fldXXX","fldYYY"]'
# SQL: must use dbTableName/dbFieldName from table get/field get, double-quote identifiers
teable sql-query --sql 'SELECT "name" FROM "bseXXX"."dbTableName" LIMIT 100'
```

### SQL Critical Rules

1. **Must use database names**: get `dbTableName` from `table get`, `dbFieldName` from `field get` — display names won't work
2. **Table format**: `"baseId"."dbTableName"` (e.g., `"bseXXX"."receipts"`)
3. **Double-quote all identifiers**: `SELECT "fieldName" FROM "schema"."table"`
4. **SELECT only** — read-only (PostgreSQL 15.4), no INSERT/UPDATE/DELETE
5. **Always add `LIMIT 100`** to non-aggregate queries to avoid large result sets
6. **JSON fields**: `json_extract_path_text("field"::json, 'key')`
7. **Dates are UTC** — convert with `timezone('Asia/Shanghai', col)` for local time

**System fields** (always available, use these exact column names): `__id`, `__auto_number`, `__created_time`, `__last_modified_time`, `__created_by`, `__last_modified_by`, `__version`

**View types**: `grid` (default), `kanban`, `form`, `gallery`, `calendar`, `plugin` — see [view.filter.md](../api-reference/view.filter.md) and related view docs for configuration.

### View Configuration

`view create` creates a bare view. Use `view update` to configure filters, sorts, grouping, and column visibility afterward:

```bash
teable view update --table-id tblXXX --view-id viwXXX --filter '<json>' --sort '<json>' --group '<json>' --column-meta '<json>'
```

See [view.filter.md](../api-reference/view.filter.md), [view.sort.md](../api-reference/view.sort.md), [view.group.md](../api-reference/view.group.md), [view.column.md](../api-reference/view.column.md) for JSON formats.

## Record Operations

> **Tip**: for exact value formats without typecast, see [record.value-format.md](../api-reference/record.value-format.md)

**Single record**: `record get --table-id tblXXX --record-id recXXX` fetches one record by ID, ignoring `--search`/`--take`/`--skip`.

**Value semantics**: `""` = skip field (no change), `null` = clear cell; checkbox: `true` = checked, `null` = unchecked

**`--typecast`**: auto-converts human-readable values (user name/email → user ID, record name → link record ID). See value types table below.

**Value types in compact array format:**

| Type | Format | Notes |
|------|--------|-------|
| Text | `"string"` | |
| Number | `42` or `123.45` | |
| Checkbox | `true` / `null` | `true` = checked, `null` = unchecked (NOT `false`) |
| Date | `"2025-01-27"` | ISO string, with or without time |
| Select | `"Done"` | |
| Multi-select | `["A","B"]` | Array of strings |
| Link | `"Record Name"` | With `--typecast`; without: `[{"id":"recXXX"}]` |
| User | `"name"` or `"email"` | With `--typecast`; without: `{"id":"usrXXX","title":"Name"}` |
| Attachment | `[{"name":"f.png","token":"xxx"}]` | Always array of objects; update **replaces all** |

**Batch limits**: `record create`/`update` max 2000 per call; `record delete` max 1000 IDs per call. `--take` (alias `--limit`) max 1000 per `record get`. For larger datasets, split into multiple calls.

**Attachment handling**: Get tokens via `upload-attachment --file-path /path/to/file`. On update, passing attachments **replaces** all existing — not appends.

**View-relative queries**: `record get --view-id viwXXX` returns rows in view order with view's filter/sort/group applied; group headers excluded — use for positional references ("the 3rd row").

**Record reordering**: `record update --header '["recordId"]' --records '[["recXXX"]]' --order '{"viewId":"viwXXX","anchorId":"recYYY","position":"before"}'`; swap = two calls.

**User fields**: use `get-collaborators --search "name"` to find users, then pass user ID or `--typecast` with display name.

## Scraping

> **Reference**: [scrape.datasets.md](../api-reference/scrape.datasets.md) — full 44+ platform index and input formats

Use `teable scrape` to extract structured data from websites. Requires `--dataset-id` (scraping template) and `--inputs` (JSON array with URL objects).

**Quick URL → dataset-id routing** (common platforms):

| URL pattern | dataset-id |
|------------|-----------|
| linkedin.com/in/... | `linkedin_person_profile` |
| linkedin.com/company/... | `linkedin_company_profile` |
| linkedin.com/jobs/... | `linkedin_job_listings` |
| amazon.com/dp/... | `amazon_product` |
| amazon.com/dp/.../reviews | `amazon_product_reviews` |
| instagram.com/&lt;user&gt; | `instagram_profiles` |
| youtube.com/watch... | `youtube_videos` |
| x.com/status/... | `x_posts` |

For all 44+ platforms: read [scrape.datasets.md](../api-reference/scrape.datasets.md)

```bash
# Scrape a single URL
teable scrape --dataset-id "linkedin_person_profile" --inputs '[{"url": "https://linkedin.com/in/example"}]'
# Batch scrape multiple URLs
teable scrape --dataset-id "amazon_product" --inputs '[{"url": "https://amazon.com/dp/XXX"}, {"url": "https://amazon.com/dp/YYY"}]'
# Polling mode — for long-running scrapes, first call returns snapshot-id; poll with:
# Pass ONLY --snapshot-id when polling (adding --dataset-id or --inputs starts a new scrape)
teable scrape --snapshot-id <snapshot-id-from-above>
```

For all platforms and input formats, read [scrape.datasets.md](../api-reference/scrape.datasets.md).

## Sending Email

`teable send-email` sends an email **directly** via the Teable mail sender (system SMTP by default). This is a one-off send — for event-driven emails *inside a workflow*, use the automation SendEmail action instead (see [automation.send-email.md](../api-reference/automation.send-email.md)).

```bash
teable send-email \
  --to "a@example.com,b@example.com" \
  --subject "Weekly report" \
  --body "## Summary\nAll green." \
  --body-type markdown
```

| Flag | Notes |
|------|-------|
| `--subject` | Email subject |
| `--body` | Body string **or a path to a file** |
| `--to` | Comma-separated recipients (required unless `--bcc` given) |
| `--cc` / `--bcc` | Comma-separated; `--bcc` satisfies the recipient requirement on its own |
| `--body-type` | `markdown` (default) or `html` |
| `--reply-to` | Reply-to address |
| `--smtp` | Custom SMTP transport as a JSON string (omit to use system SMTP) |

## Node & Folder Management

Organize nodes (tables, folders, dashboards, etc.) in a base: `get-node-tree`, `folder create`, `folder update`, `folder delete`, `folder move`.

Always `get-node-tree` first to see current structure. Reorder with: `folder move --node-id <nodeId> --parent-id <parentId> --anchor-id <siblingId> --position before|after`.

## Multi-Table Relationship Design

> **Required**: `api-reference/field.link.md` — Link field configuration
> **Optional**: `api-reference/field.lookup.md`, `api-reference/field.rollup.md` — Lookup/Rollup configuration

When building multiple related tables, plan relationships before creating anything — retrofitting Link/Lookup/Rollup wastes time and often results in poorly connected data.

**Link relationship type selection:**

| Relationship | Type | Example |
|-------------|------|---------|
| One parent, many children | `oneMany` | Department → Employees |
| Many children, one parent | `manyOne` | Tasks → Project |
| One-to-one | `oneOne` | User ↔ Profile |
| Many-to-many | `manyMany` | Tasks ↔ Tags |

**Computed field type selection:**

| Scenario | Field type | Prerequisite |
|----------|-----------|-------------|
| Display value from linked record | Lookup (`--is-lookup`) | Link field exists |
| Display value from ANY table (no link) | Conditional Lookup (`--is-conditional-lookup`) | None |
| Aggregate linked records (SUM, COUNT) | Rollup (`type: rollup`) | Link field exists |
| Aggregate ANY table (no link) | Conditional Rollup (`type: condRollup`) | None |

**Design-first workflow:**
1. **Map relationships** — identify which tables reference each other and choose Link types from the table above
2. **Build referenced tables first** — create "parent" or "lookup target" tables and populate records before the main table
3. **Create Link fields upfront** — include Link fields from the start instead of using plain text/select fields to simulate relationships
4. **Populate Link values with `--typecast`** — pass the linked table's primary field value and it auto-resolves to the correct record ID

**Common mistake:** Creating a "Category" singleSelect field instead of a Link field to a Categories table. This blocks Rollup aggregation and Lookup cross-referencing later.

## search-api + call-api

Use this pair to access any Teable API not covered by dedicated CLI commands.

1. `search-api --query "duplicate record"` — find the API
2. `call-api --method POST --url "/path" --params '{...}'` — execute it

**Narrowing results**: `--tags '["record"]'` filters by API category; `--limit 10` returns up to 10 results (default 5, max 10).

**Note**: `call-api` can execute any method (GET/POST/PUT/PATCH/DELETE).

## One-Time Data Visualization

For static charts/reports from already-queried data, use HTML code blocks (` ```html `) — no CLI command needed.

- HTML must start with `<!DOCTYPE html>` or `<html>` to enable preview
- Recommended: Tailwind CSS + ECharts CDN
- Only generate when user clearly requests it; may actively recommend
- For live dashboards or interactive UIs that need ongoing data access → use `app create` instead

## Error Troubleshooting

When a command fails, follow this procedure:
1. `teable config show` — check current endpoint, baseId, and token status
2. `teable auth status` — confirms connection and permissions
3. Verify IDs exist: `table get` (for table IDs) or `field get` (for field IDs)
4. Check common errors: **field type mismatch** (passing text to number field), **ID not found** (deleted or from different base), **permission denied** (user lacks write access)
