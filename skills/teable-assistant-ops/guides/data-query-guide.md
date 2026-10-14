# Data Query Guide

Use this guide to choose a data-read path or diagnose a query failure. Query execution serves people, scripts, reports, integrations, and apps; it is not specific to AI or App Builder.

## Choose a supported entry

| Need | Choose |
|------|--------|
| Record identities for later writes, view-relative reads, simple search | `record get` |
| Cross-table joins or SQL-specific analysis | `sql-query`, following [SQL critical rules](cli-reference.md#sql-critical-rules) |
| One-off structured read | Inline definition, only when the installed CLI and host expose structured execution |
| Reusable reads in a named-query App | Versioned `teable/queries.yaml` and generated server-only functions; see the workflow below |

For an unfamiliar capability, discover the installed command surface with `teable --help` or `teable tools list --search query`, then read the selected command's help. Backend implementation, a source PR, and a CLI version number alone do not prove that a target host has enabled a route. This skill follows the released CLI manifest; do not invent command names, query IDs, or URLs for an unavailable feature. Keep using the supported entry that fits the requested operation.

## Structured execution, when available

- Use the command's generated schema and help as the request authority. HTTP clients and CLI callers should use that same request/response contract, not separate hand-maintained schemas.
- The transport accepts `definition`, optional public `parameters`, and optional `queryId` for observability. The full definition is always required; a name does not grant access or refer to a server-side query library. The server validates current fields, authorization and parameter types before compiling parameterized SQL.
- The Nest endpoint is experimental and defaults off behind `V2_DATA_QUERY_ENABLED`. A disabled host does not advertise it in public OpenAPI. Explicit host enablement and a CLI release containing the command are separate prerequisites.
- Use stable table/field IDs and declared output aliases for structured reads. Keep database names confined to the raw SQL entry. Support for arbitrary SQL or joins in one entry does not imply support in another.

## Named-query Apps, when available

Check the actual App source first. Opted-in fresh Apps provide `teable/queries.yaml`, a generated JSON Schema, `lib/queries.ts`, and managed `teable/query-tool.mjs`. Keep existing apps on their current read path unless the user explicitly adopts named queries; restoring an app does not migrate SQL automatically.

1. Read authorized table/field metadata and the supplied manifest schema. Keep editable definitions in `teable/queries.yaml`, not page components. The root is `schemaVersion: 1` plus `queries`; each stable name maps to `definition` and optional `result: many | one`.
2. Define functions such as `getTodos` and `getTodoById`. Single-record queries use the definition's `recordId`, optionally `{ type: parameter, name: id }`, with a declared string parameter. `result: one` requires this identity predicate; never fetch all rows to implement lookup by ID.
3. In the App workspace run `node teable/query-tool.mjs generate --live`, then `node teable/query-tool.mjs check --live`. The bundled tool uses injected `TEABLE_API_URL` / `TEABLE_APP_TOKEN` on the server; do not print them. Live validation checks schema and App permissions without reading records. Offline validation alone is not authority proof.
4. Import `queries` from `@/lib/queries` only in server-side code, then call `queries.getTodos(...)` or `queries.getTodoById({ id })`. Do not hand-edit generated code/schema or parse YAML per request. Numeric values can be strings when needed for precision; composite/computed values may remain `unknown`.
5. Keep pages, YAML and generated artifacts in the same App version. Build/save/publish gates reject invalid definitions or stale artifacts. Fix the named query and regenerate; do not delete the manifest, substitute an empty response, or fall back to SQL to bypass a failure. `one` returns `null` only for a successful zero-row result.

The standalone managed tool does not require an installed `teable` binary. The released CLI manifest does not yet advertise named-query commands; use the supplied App runner only when it actually exists. Discover any future CLI equivalents through installed help rather than inventing command names. CLI live validation runs with its configured credential; an editor's successful PAT check does not prove the App can read the same fields.

Names are App-local functions, not new API routes. JSON Schema describes the query language; OpenAPI describes its transport. oRPC is not required, and browser query caches do not replace backend authorization.


## Permissions and parameters

The credential's effective identity controls table, row and field access. Each execution resolves current authorization; retaining a definition in an App manifest or code does not retain an earlier permission decision.

Only declared public input values belong in `parameters`. Parameter declarations have no `source` property. Actor identity, groups, permission scope and database routing remain host-owned; caller `contextParameters` and `reference` properties are rejected. User-field `Me` uses the authenticated execution actor, not a caller-supplied user ID.

For generated apps, login controls admission to the app; it does not by itself establish viewer-specific row/field authorization for server-side data requests. Confirm the effective data identity and server-side access policy when users must see different records. See [App login](app-builder-guide.md#app-login--authentication).

## Failure and performance decisions

- Preserve the selected entry's documented error result. A permission denial, incompatible schema, timeout or missing endpoint is not an empty dataset.
- Keep a failed structured request as an explicit failure; never silently switch it to raw SQL. The entries have different capability and authorization semantics.
- Compare equivalent queries, identities, row/field scopes and datasets before claiming a performance improvement. Inline reads retain live metadata validation and authorization; they do not automatically cache results, create indexes or fix a slow SQL plan.
- For slow reads, keep projection and result limits bounded, distinguish client/metadata time from database execution, and report the measured case. Index or schema changes require a separate authorized operation; this guide grants no permission to apply them.
