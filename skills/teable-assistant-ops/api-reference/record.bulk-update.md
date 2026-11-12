# Updating and Deleting Records: Conditions or Fixed IDs

Use the existing `update-records` tool (CLI: `teable record update`) in exactly one of two modes.

## Condition mode: the same values for all matching rows

For “set every Todo task to Done”, send one condition update. Read field metadata to resolve the actual IDs and types first; do not page through records to collect IDs.

```json
{
  "tableId": "tblTasks",
  "filter": { "fieldId": "fldStatus", "operator": "is", "value": "Todo" },
  "fields": { "fldStatus": "Done" },
  "typecast": true
}
```

```sh
teable record update --table-id tblTasks --filter '{"fieldId":"fldStatus","operator":"is","value":"Todo"}' --fields '{"fldStatus":"Done"}'
```

- Replace example IDs with real table/field IDs. Every filter condition's `fieldId` must be an actual field ID; keys in `fields` may be field names or IDs.
- The filter is evaluated when the write executes, not against an earlier read or selection. Metadata and risk checks are appropriate; a prior count is not a promise of the number that will change.
- Filters accept a condition, a group such as `{ "conjunction": "or", "items": [{ "fieldId": "fldStatus", "operator": "is", "value": "Todo" }, { "fieldId": "fldStatus", "operator": "is", "value": "Blocked" }] }` (`"and"` also works; `filterSet` aliases `items`), or `{ "not": { "fieldId": "fldStatus", "operator": "is", "value": "Done" } }`. Use field-compatible operators and values; see `view.filter` for those definitions.
- Both `filter` and `fields` must be nonempty. Omit `header`, `records`, and `order` in this mode.
- Every key in `fields` is a requested assignment: omit a key to leave it alone, use `null` to clear it. `""` is a supplied value, not the records-mode skip marker.
- `updatedCount` reports rows actually changed, not rows matched. Repeating an assignment with no value changes returns 0.

## Records mode: fixed identities, per-row values, or reordering

Use this for selected rows, explicit record IDs, different values per row, or `order`. A chat selection is a fixed set of IDs, not a condition to reevaluate.

```json
{
  "tableId": "tblTasks",
  "header": ["recordId", "fldStatus"],
  "records": [["recTaskA", "Done"], ["recTaskB", "Blocked"]],
  "typecast": true
}
```

```sh
teable record update --table-id tblTasks --header '["recordId","fldStatus"]' --records '[["recTaskA","Done"],["recTaskB","Blocked"]]'
```

Keep `filter` and `fields` out of this mode. Only records-mode cells treat `""` as “skip this field”; `null` clears the cell. The CLI enables typecasting by default in both modes. For exact non-typecast values, see `record.value-format`.

## Deletion: condition or fixed selection

Use `delete-records` (CLI: `teable record delete`) with exactly one selector: a nonempty `filter` for a condition, or `recordIds` for a fixed selection of 1–1000 IDs. Resolve actual readable field IDs from metadata before constructing the condition. A chat selection stays its captured IDs, not a filter that can select different rows.

```json
{
  "tableId": "tblTasks",
  "filter": {
    "conjunction": "and",
    "items": [
      { "fieldId": "fldStatus", "operator": "is", "value": "Archived" },
      { "not": { "fieldId": "fldKeep", "operator": "is", "value": true } }
    ]
  }
}
```

```sh
teable record delete --table-id tblTasks --filter '{"fieldId":"fldStatus","operator":"is","value":"Archived"}'
# Fixed selection instead:
teable record delete --table-id tblTasks --record-ids '["recTaskA","recTaskB"]'
```

- The same canonical filter shapes described above apply: nested `and`/`or` with `items` or `filterSet`, and `not`. Empty or malformed filters, no selector, and both selectors are rejected.
- The filter goes directly to `DELETE /api/v2/tables/deleteRecords` without reading matching record IDs. Matching happens when the deletion executes; prior counts do not lock that set. This is synchronous native record deletion with its normal effects and undo pipeline, not a durable job or an unlimited-resource promise.
- Conditional `deletedCount` is the actual number of committed deletions. No matches return 0; repeating the same condition after deleting its matches returns 0.
- The server freezes and locks the matching rows before link cleanup. Undo uses their original pre-cleanup values, including optional one-way self links; linked rows that survive are still cleaned up normally. Frozen IDs use typed-array parameters rather than one SQL parameter per row.
- Table and row delete permissions apply. Every predicate field must be readable throughout the caller's allowed delete scope, including nested conditions, negations, and right-hand field references. No wider read scope or second reader role is needed. Unproven coverage fails closed with `authority_matrix.record_delete_selector_filter_forbidden` and no deletion.
- Surface conditional and permission errors. Use a readable predicate for an authorized new request; never enumerate IDs, switch selectors, or use SQL to bypass a failed conditional delete.

## Update errors and permissions

Both modes retain the caller's token and permission checks. A condition update applies static field permissions and row filters; every field its filter references — including nested conditions, negations, and right-hand field references — must be readable throughout the caller's allowed update scope, not outside it. A row-scoped role can update its own rows without a second role or wider read access. The server proves that the update scope is covered by the read scope and each predicate field's visibility scope; supported equal and composed scopes are accepted, while unprovable coverage fails closed with `authority_matrix.record_update_selector_filter_forbidden`. The caller's filter is never used to prove its own read permission. Use records mode only when the caller already has explicit record IDs from a readable source. When write-field permissions differ across rows, the existing `authority_matrix.record_update_selector_fields_forbidden` rejection takes precedence and directs the caller to records mode. If a condition update reports an unsupported relation write, surface the error and its records-mode guidance; do not automatically enumerate IDs or switch modes. This is not a blanket restriction on all link fields. Correct missing field IDs, incompatible values, mixed modes, or empty inputs without changing the user's target set.
