# Data Query Guide

Use this guide to choose a data-read path or diagnose a query failure. Query execution serves people, scripts, reports, integrations, and apps; it is not specific to AI or App Builder.

## Choose a supported entry

| Need | Choose |
|------|--------|
| Record identities for later writes, view-relative reads, simple search | `record get` |
| Cross-table joins or SQL-specific analysis | `sql-query`, following [SQL critical rules](cli-reference.md#sql-critical-rules) |
| A one-off or app-local structured read | An inline definition, **only if the installed CLI and selected host expose structured execution** |

For an unfamiliar capability, discover the installed command surface with `teable --help` or `teable tools list --search query`, then read the selected command's help. Backend implementation, a source PR, and a CLI version number alone do not prove that a target host has enabled a route. This skill follows the released CLI manifest; do not invent command names, query IDs, or URLs for an unavailable feature. Keep using the supported entry that fits the requested operation.

## Structured execution, when available

- Use the command's generated schema and help as the request authority. HTTP clients and CLI callers should use that same request/response contract, not separate hand-maintained schemas.
- The structured interface accepts an inline `definition` and optional public `parameters`. It has no saved-reference, revision or query-sharing mode. The server validates current fields, authorization and parameter types and compiles the query; inline is not client-generated SQL or a permission bypass.
- The Nest endpoint is experimental and defaults off behind `V2_DATA_QUERY_ENABLED`. A disabled host does not advertise it in public OpenAPI. Explicit host enablement and a CLI release containing the command are separate prerequisites.
- Use stable table/field IDs and declared output aliases for structured reads. Keep database names confined to the raw SQL entry. Support for arbitrary SQL or joins in one entry does not imply support in another.

## Permissions and parameters

The credential's effective identity controls table, row and field access. Each execution resolves current authorization; retaining a definition in app code does not retain an earlier permission decision.

Only declared public input values belong in `parameters`. Parameter declarations have no `source` property. Actor identity, groups, permission scope and database routing remain host-owned; caller `contextParameters` and `reference` properties are rejected. User-field `Me` uses the authenticated execution actor, not a caller-supplied user ID.

For generated apps, login controls admission to the app; it does not by itself establish viewer-specific row/field authorization for server-side data requests. Confirm the effective data identity and server-side access policy when users must see different records. See [App login](app-builder-guide.md#app-login--authentication).

## Failure and performance decisions

- Preserve the selected entry's documented error result. A permission denial, incompatible schema, timeout or missing endpoint is not an empty dataset.
- Keep a failed structured request as an explicit failure; never silently switch it to raw SQL. The entries have different capability and authorization semantics.
- Compare equivalent queries, identities, row/field scopes and datasets before claiming a performance improvement. Inline reads retain live metadata validation and authorization; they do not automatically cache results, create indexes or fix a slow SQL plan.
- For slow reads, keep projection and result limits bounded, distinguish client/metadata time from database execution, and report the measured case. Index or schema changes require a separate authorized operation; this guide grants no permission to apply them.
