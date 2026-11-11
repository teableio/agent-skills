# Data Query Guide

Use this guide to choose a data-read path or diagnose a query failure. Query execution serves people, scripts, reports, integrations, and apps; it is not specific to AI or App Builder.

## Choose a supported entry

| Need | Choose |
|------|--------|
| Record identities for later writes, view-relative reads, simple search | `record get` |
| Cross-table joins or SQL-specific analysis | `sql-query`, following [SQL critical rules](cli-reference.md#sql-critical-rules) |
| One-off structured read during App development | `teable query inline` on an explicitly enabled host |
| Diagnose admission/routing without reading rows | `teable query explain` on an explicitly enabled host |
| Reusable reads in a named-query App | Versioned `teable/queries.yaml` and generated server-only functions; see the workflow below |

For an unfamiliar capability, discover the installed command surface with `teable --help` or `teable tools list --search query`, then read the selected command's help. Backend implementation, a source PR, and a CLI version number alone do not prove that a target host has enabled a route. This skill follows the released CLI manifest; do not invent command names, query IDs, or URLs for an unavailable feature. Keep using the supported entry that fits the requested operation.

## Structured execution, when available

- Use `teable query schema` (offline, no credentials/project/network) and help as the request authority. HTTP clients and CLI callers should use that same request/response contract, not separate hand-maintained schemas.
- The transport accepts `definition`, optional public `parameters`, and optional `queryId` for observability. The full definition is always required; a name does not grant access or refer to a server-side query library. The server validates current fields, authorization and parameter types before compiling parameterized SQL.
- The Nest endpoint is experimental and defaults off behind `V2_DATA_QUERY_ENABLED`. A disabled host does not advertise it in public OpenAPI. Explicit host enablement and a CLI release containing the command are separate prerequisites.
- Use stable table/field IDs and declared output aliases for structured reads. Keep database names confined to the raw SQL entry. Support for arbitrary SQL or joins in one entry does not imply support in another.

### Temporary inline reads during App development

Use the ephemeral records command when the AI needs to inspect live data before deciding what
belongs in the App. It builds the same canonical `definition` sent by `teable query execute` and
does not write `queries.yaml`, `lib/queries.ts`, or an App version:

```bash
teable query inline \
  --table-id tblXXX \
  --select '[{"fieldId":"fldXXX","alias":"title"}]' \
  --filter '{"fieldId":"fldYYY","operator":"isGreaterEqual","value":10}' \
  --limit 100
```

The default/maximum limit is 100/1000. For relation-aware reads, `--relations` takes a JSON map of aliases to `{ linkFieldId, tableId, filter? }` and switches to version 2; use stable IDs and the canonical schema rather than SQL join syntax. This is a development inspection entry only; do not copy it into page runtime code. `teable query execute --request @file` accepts the full canonical request, including aggregate definitions, without a duplicate project ID. Neither execution entry falls back to SQL.

In an App that has `teable/queries.yaml`, runtime reads use generated `lib/queries.ts`. Do not
import or call `sqlQuery` from `@/lib/teable` as a fallback. Keep `sql-query` for legacy Apps and
one-off cross-table or SQL-specific analysis. A failed inline/named query is an explicit error,
not permission to silently retry through SQL.

### Named-query Apps, when available

Check the actual App source first. Opted-in fresh Apps provide `teable/queries.yaml`, a generated JSON Schema, `lib/queries.ts`, and managed `teable/query-tool.mjs`. Keep existing apps on their current read path unless the user explicitly adopts named queries; restoring an app does not migrate SQL automatically.

1. Read authorized table/field metadata and the supplied manifest schema. Keep editable definitions in `teable/queries.yaml`, not page components. The root is `schemaVersion: 1` plus `queries`; each stable name maps to `definition` and optional `result: many | one`.
2. Define functions such as `getTodos` and `getTodoById`. Single-record queries use the definition's `recordId`, optionally `{ type: parameter, name: id }`, with a declared string parameter. `result: one` requires this identity predicate; never fetch all rows to implement lookup by ID.
3. Use `teable query manifest-schema` for the offline manifest contract, then `teable query validate --file teable/queries.yaml --live` and `teable query generate --file teable/queries.yaml --live --out lib/queries.ts` for authoring. Live checks validate structured definitions as the CLI's authenticated principal, not automatically as the App; retain the App-credential build/save/publish checks. If supplied, the standalone `teable/query-tool.mjs` can generate/check with injected `TEABLE_API_URL` / `TEABLE_APP_TOKEN`; never print them. Offline validation alone is not authority proof.
4. Import `queries` from `@/lib/queries` only in server-side code, then call `queries.getTodos(...)` or `queries.getTodoById({ id })`. Do not hand-edit generated code/schema or parse YAML per request. Numeric values can be strings when needed for precision; composite/computed values may remain `unknown`.
5. Keep pages, YAML and generated artifacts in the same App version. Build/save/publish gates reject invalid definitions or stale artifacts. Fix the named query and regenerate; do not delete the manifest, substitute an empty response, or fall back to SQL to bypass a failure. `one` returns `null` only for a successful zero-row result.

Run `teable query lint` before saving to catch duplicate/unused definitions, combinatorial filter/sort cross-products and authoring limits. Dynamic access such as `queries[id]` yields usage-unknown info rather than proof a query is unused. Lint warnings normally exit 0; `--strict` fails warnings, not info. This does not replace backend save/publish validation.

SQL retirement is distinct from the standalone `sql-query` command: manifest `mode: sql-query` warns as frozen; `mode: auto` has a frozen, never-executed SQL fallback reported as info. `query validate` and `query generate` also accept `--strict` to fail the SQL-freeze warning; their live checks validate structured definitions, while SQL fallback admission remains a backend save/publish gate.

Names are App-local functions, not new API routes. JSON Schema describes the query language; OpenAPI describes its transport. oRPC is not required, and browser query caches do not replace backend authorization.


## Permissions and parameters

The credential's effective identity controls table, row and field access. Each execution resolves current authorization; retaining a definition in an App manifest or code does not retain an earlier permission decision.

Only declared public input values belong in `parameters`. Parameter declarations have no `source` property. Actor identity, groups, permission scope and database routing remain host-owned; caller `contextParameters` and `reference` properties are rejected. User-field `Me` uses the authenticated execution actor, not a caller-supplied user ID.

For generated apps, login controls admission to the app; it does not by itself establish viewer-specific row/field authorization for server-side data requests. Confirm the effective data identity and server-side access policy when users must see different records. See [App login](app-builder-guide.md#app-login--authentication).

## Schema changes and repairs

Before renaming, retyping or deleting fields, run `teable query deps` against each relevant App manifest and review the stable table/field dependency index. It is fully offline: SQL-path queries (`auto`, `sql-query`) have incomplete field sets, so absence from the index is not proof a field is unused.

After a schema change or `app pull`, inspect `query repairs` for the project/app, then use the repair ID to read its full per-query plan and manifest diff. Apply only a reviewed `applyable: true` plan with `query repair-apply`; blocked plans need a human decision. Applying writes a **new App version**, preserving history, and refuses stale app versions/manifests. Pull the checkout afterwards. If handled manually instead, use `query repair-dismiss` with a reason; dismissing is not a code repair.

## Failure and performance decisions

- Preserve the selected entry's documented error result. A permission denial, incompatible schema, timeout or missing endpoint is not an empty dataset.
- Keep a failed structured request as an explicit failure; never silently switch it to raw SQL. The entries have different capability and authorization semantics.
- Compare equivalent queries, identities, row/field scopes and datasets before claiming a performance improvement. Inline reads retain live metadata validation and authorization; they do not automatically cache results, create indexes or fix a slow SQL plan.
- For slow reads, keep projection and result limits bounded, distinguish client/metadata time from database execution, and report the measured case. Index or schema changes require a separate authorized operation; this guide grants no permission to apply them.
- Use `teable query explain` with either a canonical request alone or inline query inputs (including relations), not both. It runs admission/schema/binding/authorization/routing as the caller but does not execute the business SELECT. It requires host enablement, just like execute. Its SQL, ordered parameter names, generic/structural plan and timing are diagnostic—not a measured runtime plan; bind values, permission predicates and rows are not printed.

## Bounded migration evidence

Use `teable query coverage` only with a restricted OTLP/JSON execution export (`resourceSpans[].scopeSpans[].spans[]`), not arbitrary trace formats. Keep exports bounded (20 MiB and 100000 inspected spans maximum; lower `--max-spans` for focused analysis). Reports are aggregate-only; do not add raw SQL or identifiers to summaries.

Treat records/aggregate candidates as migration hints, not semantic equivalence. Structural coverage is separate from adoption: adoption requires the exact environment, service and UTC `[start,end)` window together and counts only identified exported SQL/structured execute endpoint SERVER requests—not all production requests or users. Missing scope makes adoption unavailable. Supply a restricted effective export policy with provenance SHA-256 when known; otherwise policy stays unknown. Sampling flags are not an export ratio and no inverse weighting is applied. Preserve missing-parent/environment/timestamp and capped-row uncertainty in conclusions.
