# Artifact Guide

Use artifacts for durable HTML pages, charts, or Markdown reports that should remain available in Teable. For an ephemeral answer shown only in the conversation, use an inline HTML block instead.

## Workflow

1. Build and inspect the content in a local file.
2. Run `artifact list` first, scoped by project and/or name search when useful. If the same deliverable already exists, update it instead of creating a duplicate.
3. If no match exists, `artifact create` once and retain the returned artifact ID.
4. For later revisions, restore the current source with `artifact get` if the local working file is unavailable; edit that file rather than recreating the artifact from memory.
5. `artifact update` the same artifact. Each update appends an immutable version, so earlier versions remain restorable.

## Sharing safely

Artifacts are private to their creator by default. Never share automatically after creation; use `artifact share` only when the user explicitly asks. Inspect an existing share with `--status` before changing it. Confirm the audience: `space` requires signed-in members of its space; `public` permits anyone with the link. The first share needs an explicit scope; later updates retain it when omitted.

Use only a password the user supplied, never invent one. An expiry must be an ISO datetime; an empty string removes the password or expiry, so do not clear either implicitly. Return the command's link rather than constructing one. To stop access, use `--disable`; it invalidates the link immediately.

## Content Rules

- HTML must be self-contained: inline CSS/JS and inline SVG are safe defaults.
- Do not reference external CDN URLs. If a library is needed, load an exact version from `/api/artifact-vendor/<pkg>@<version>/<file>`.
- Choose Markdown for text-first reports; use HTML for charts or interactive presentation.
- `artifact create` uses project context; `artifact update`, `artifact get`, and `artifact share` target the artifact ID directly.
- Use `artifact get --version <n>` when restoring a specific historical version rather than the current one.
