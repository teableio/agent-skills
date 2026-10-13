# Data Query Guide

Use this guide for choosing a data-read path, reusing a query, or diagnosing a query failure. Query execution serves people, scripts, reports, integrations, and apps; it is not specific to AI or App Builder.

## Choose a supported entry

| Need | Choose |
|------|--------|
| Record identities for later writes, view-relative reads, simple search | `record get` |
| Cross-table joins or SQL-specific analysis | `sql-query`, following [SQL critical rules](cli-reference.md#sql-critical-rules) |
| A one-off or app-local structured read | An inline definition, **only if the installed CLI and selected host expose structured execution** |
| One managed query reused across apps, reports, or tasks | A saved reference with an explicit revision policy, **only if the host provides that query resource and execution entry** |

For an unfamiliar capability, discover the installed command surface with `teable --help` or `teable tools list --search query`, then read the selected command's help. Backend implementation, a source PR, and a CLI version number alone do not prove that a target host has enabled a route. This skill follows the released CLI manifest; do not invent command names, query IDs, or URLs for an unavailable feature. Keep using the supported entry that fits the requested operation.

## Structured execution, when available

- Use the command's generated schema and help as the request authority. HTTP clients and CLI callers should use that same request/response contract, not separate hand-maintained schemas.
- Inline sends a `definition` and public `parameters`; it does not require creating a saved-query resource. Prefer it for exploratory reads or logic private to one app. The server still validates fields, authorization and parameter types and compiles the query; inline is not client-generated SQL or a permission bypass.
- A saved `reference` identifies a query and explicitly selects a pinned revision or latest. Use a pin for reproducible integrations; follow latest only when the consumer intentionally accepts future definition changes. Obtain real references through the host's authorized query-management surface, not by guessing a CRUD command.
- Query-library storage is for definitions, contracts and history, not business rows. Saving a query does not cache its result or guarantee faster execution. Do not persist every one-off read just because a library exists.
- Use stable table/field IDs and declared output aliases for structured reads. Keep database names confined to the raw SQL entry. Support for arbitrary SQL or joins in one entry does not imply support in another.

## Permissions and parameters

The credential's effective identity controls data access. Access to view, execute or edit a saved query is separate from access to its underlying tables, rows and fields. Sharing a definition is not permission to read as its owner. Pinning a revision freezes neither permissions nor data.

Only public input values belong in caller parameters. Actor identity, groups, permission scope and trusted context values are resolved by the host; do not submit them as request properties or try to override a server-owned parameter. A missing trusted value requires fixing the authorized host integration, not supplying the value from the client.

For generated apps, login controls admission to the app; it does not by itself establish viewer-specific row/field authorization for server-side data requests. Confirm the effective data identity and server-side access policy when users must see different records. See [App login](app-builder-guide.md#app-login--authentication).

## Failure and performance decisions

- Preserve the selected entry's documented error result. A permission denial, incompatible schema, timeout or missing endpoint is not an empty dataset.
- Do not silently replace a failed saved reference with an inline definition, or switch a failed structured request to raw SQL. That can change semantics and authorization. Diagnose the failure, then choose another entry only as an explicit supported operation.
- Compare equivalent queries, identities, row/field scopes and datasets before claiming a performance improvement. Saved references add lookup/governance work; inline avoids that lookup but retains live validation and authorization. Neither automatically creates indexes or fixes a slow SQL plan.
- For slow reads, keep projection and result limits bounded, distinguish client/metadata time from database execution, and report the measured case. Index or schema changes require a separate authorized operation; this guide grants no permission to apply them.
