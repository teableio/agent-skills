# Data PR Promotion Guide

Use this workflow (CLI 0.6.57 or later) when Builder working-copy row changes need bounded Data PR review/export, rather than the ordinary [database pull/push workflow](db-guide.md).

## Validate → select → reconcile

1. Confirm the intended Project and local workspace. Promotion export requires a **complete, writable Builder working copy**; do not substitute a sparse, schema-only, or historical read-only checkout.
2. Use `db diff --promotion-base <baseId>` to validate the working copy for export. This is distinct from `--base-id` for remote revision comparisons; do not treat a normal diff as promotion validation.
3. Use `db diff --promotion-selection <file>` for bounded Data PR candidates or selected-row export. Review the selection and intended changes before handing off an export; exporting is not proof that a Data PR was applied. Use the file contract supplied by the Builder/Data PR workflow, not guessed JSON.
4. After the Data PR is applied, retain its receipt and use `db pull --promotion-receipt <file>` to advance the local Builder checkout. Use an applied Data PR receipt, not the selection/export file or an invented receipt. Recheck status and diff before further work.

The CLI help exposes these entry points but does not define selection/receipt schemas or the Data PR review/apply interface. Consult the supplied workflow and installed help before composing files or combining promotion options; do not invent a Data PR apply command.
