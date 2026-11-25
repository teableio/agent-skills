# Saved Query Library Guide

Use `query library` (CLI 0.6.56 or later) to discover, reuse and version saved Project queries and shared metrics. Keep temporary exploration in `query inline/execute`; keep App runtime reads in the [named-query App workflow](data-query-guide.md#named-query-apps-when-available). These are separate entry points, not interchangeable query names.

## Reuse before authoring

1. Supply the target Project with `--base-id`. Search visible queries and shared metrics with `query library list`; narrow by phrase and scope (`all`, `mine`, or `base`), and follow returned pagination cursors before concluding there is no match.
2. Use `query library describe` to inspect the candidate. Inspect the intended revision's parameters, admitted dimensions (including `monthDimensions`) and outputs; request its definition when needed rather than guessing the contract.
3. Execute with `query library run`, pinning the returned ID and an explicit revision. Bind declared runtime parameters as JSON or `@file`; do not interpolate values into formula text. A saved query's visibility is not proof of unrestricted data access; report authorization/execution failures instead of retrying through SQL.

## Metric parameter decisions

Derive metric inputs from the described revision, not field display names. For ordinary metrics, use admitted aliases in `groupBy` and equality filters named `where_<alias>`. For a month comparison, send `compareDimension` from `monthDimensions` and `compareMonth` (`YYYY-MM`) together; omit `groupBy` and the comparison alias's `where_<alias>` filter. Preserve exact numeric strings unchanged rather than coercing them to floating-point numbers.

## Save and share deliberately

- Author a canonical definition using `query schema` and authorized table/field metadata. `query library save` takes the definition, not an inline execution request wrapper. Add a useful name, summary and parameter examples without embedding credentials or sensitive sample data.
- Save creates a private revision. To revise an existing query, retain its ID and append instead of creating a duplicate. Read current state before updating and use its state version for optimistic concurrency; reuse a stable mutation ID when retrying the same save. On a stale-state error, reread and reconcile rather than overwriting blindly.
- Sharing is a separate, explicit user decision. `query library share` shares the current head with the Project; supply the reviewed revision and current expected state version. Do not assume saving another revision shares it automatically.
- `query library unshare` revokes **all shared revisions**, not just the latest one. Confirm that scope and use the current expected state version before revoking access.

For App manifests that reference library queries, consult `query manifest-schema` for the installed reference shape rather than inventing YAML. Pass the containing Project via `--base-id` to `query validate/generate` when resolving library references; retain live validation and App build/save/publish checks. Offline-only assumptions from self-contained definitions do not establish that referenced queries remain visible or authorized.
