# AI Field Guide

Use AI-configured fields for per-record classification, extraction, summaries, translation, or generated images; use [media](media-guide.md) for standalone images and [App AI](app-builder-guide.md#ai-in-apps) for application code.

## Configure → fill → wait → verify

1. Read `teable field ai-docs` (equivalent to `get-doc --topic field.ai`) for the current project's available models and exact `aiConfig` schema. Do not hardcode model names or guess configuration shapes.
2. Read source/target field metadata, then create or update the target field with `aiConfig`. Configuration alone does **not** generate values.
3. Trigger `field ai-fill` for each configured field. Prefer `emptyOnly` to preserve existing content; the default `all` overwrites values, so confirm replacement intent. Scope to a record or view when the request is narrower than the whole table.
4. After triggering every intended field, use `field ai-status --poll` once for the table, optionally restricted to those field IDs. Do not resubmit fills just because work is still running.
5. Read generated cells with `record get` before reporting success. An accepted task ID is not completed generation; `done` means nothing is running and includes failed runs. Report remaining failures rather than treating them as generated content.

A polling timeout is not proof of failure or cancellation. Check status again for the same table/fields instead of starting another overwrite run. Keep repetitive polling output out of conversation context when background execution is available.
