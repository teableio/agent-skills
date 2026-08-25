---
name: sync-teable-assistant-ops
description: >-
  Update/sync the teable-assistant-ops skill docs against the latest Teable CLI
  (@teable/cli in the teable-ee repo). Use when asked to 更新/同步 the skill, sync
  to a new CLI version, check what CLI changes are pending, diff the command
  surface, or validate the skill's links. Driver:
  .claude/skills/sync-teable-assistant-ops/driver.sh (scan / manifest-diff /
  mark-synced / check).
---

# Sync teable-assistant-ops against the Teable CLI

The `skills/teable-assistant-ops` docs describe the `@teable/cli` command surface,
which is developed in the **teable-ee** repo (`packages/ai-tools-cli`). This skill
keeps them in sync. The driver does the mechanical parts (version-delta detection,
diff reports, command-surface snapshots, link validation); **the doc edits
themselves are judgment work you do by hand** — the skill files are curated
adaptations, not generated output.

All paths below are relative to the agent-skills repo root.
Driver: `.claude/skills/sync-teable-assistant-ops/driver.sh`.

## Prerequisites

- A `teable-ee` checkout as a **sibling directory** of this repo (default
  `../teable-ee`), or set `TEABLE_EE_DIR` / pass `--ee <path>`.
- npm network access for `manifest-diff` / `mark-synced` (they run
  `npx -y @teable/cli@<ver> manifest`). `scan` works offline except for the
  best-effort `git fetch` (silence with `--no-fetch`).

## Workflow

```bash
D=.claude/skills/sync-teable-assistant-ops/driver.sh

# 1. What changed since the last sync?
$D scan                       # version delta, CLI commits, diff stats, doc-topic mapping
$D scan --full-diff           # same + full doc-source and command-registry diffs
$D manifest-diff              # flag-level command-surface diff vs the stored snapshot

# 2. Edit the skill docs (by hand — see Editing rules below)

# 3. Validate + record
$D check                      # every relative .md link and #anchor must resolve
$D mark-synced <new-version>  # writes last-synced.json + manifest snapshot
```

Then commit everything together (docs + `last-synced*.json`), following the
established message format: `docs: sync teable-assistant-ops skill to Teable CLI
vX.Y.Z`. Branch off `main`, open a PR (see repo history, e.g. PR #5/#7).

`scan` resolves "last synced" from `last-synced.json` in this skill dir
(fallback: `metadata.json` `engines.teableCli`, or `--from X.Y.Z`). It reports
"Up to date" when there is nothing to do — that is the expected steady state.

## Editing rules (the judgment layer)

Where a CLI change lands in the skill:

| Change type | Files to touch |
|---|---|
| Flag added/renamed/required | `guides/cli-reference.md` + `guides/base-id-reference.md` (+ the module's guide) |
| New verbs in an existing group | module guide + SKILL.md module-map row |
| Whole new command group | new `guides/<module>-guide.md` + SKILL.md module map & routing rules |
| Doc-source change (`packages/ai-tools/src/docs/**`) | the mirrored `api-reference/<cat>.<topic>.md` |
| New static doc topic | new `api-reference/<cat>.<topic>.md` + SKILL.md API Reference Index |
| New dynamic doc topic (`{{...}}` runtime variables) | SKILL.md "Dynamic" line ONLY — never mirror it |

Principles learned the hard way:

- **api-reference files are adaptations, not verbatim mirrors.** Port the
  *semantics* of the upstream diff into the file's existing structure; never
  overwrite a file wholesale with the upstream text.
- **Quote CLI help/source verbatim for constraints** (permission requirements,
  enum values, limits). Paraphrasing introduces subtle errors — e.g.
  "Owner/Creator" is not the same set as "matrix admin".
- **Keep `\n` escapes literal.** Upstream `\\n` in a `.doc.ts` template must
  appear as `\n` in the markdown — expanded real newlines have produced invalid
  JSON examples and broken tables before.
- **Self-containment beats DRY in api-reference** (each file is loaded alone);
  progressive disclosure governs SKILL.md vs guides (summary + pointer is fine,
  full duplication is not).
- **Verify flags against source**, not memory: check `requiredOption(...)` in
  `packages/ai-tools-cli/src/commands/**` before writing a parameter table.
  `base-id-reference.md` is the most drift-prone file.
- **Meta/tooling commands don't get documented** in teable-assistant-ops (e.g.
  the hidden `manifest` command) — it describes Cuppy's operational surface.
  A version whose only changes are meta-tooling is still `mark-synced`.
- `metadata.json`: bump the skill's own minor version on every content sync;
  bump `engines.teableCli` only when the *documented* surface requires the newer
  CLI (it means "minimum required", not "last synced" — `last-synced.json`
  tracks that).

## Gotchas

- **The local teable-ee checkout is usually behind.** Always diff against
  `origin/develop`; the driver's baseline search does this (a plain `git log -S`
  on HEAD misses commits that only exist on origin — real bug, already fixed).
- **npm is the publish truth.** `npm view @teable/cli version` can differ from
  the repo (e.g. 0.6.27 was skipped on npm; a commit bumped 0.6.26 → 0.6.28).
  `scan` warns when npm and `origin/develop` disagree.
- **Baseline detection** uses `git log <ref> -S '"version": "X.Y.Z"'` on the CLI
  `package.json`; the oldest hit is the introducing commit. Works only with an
  exact `X.Y.Z`, not a range like `0.6`.
- **`teable manifest` (0.6.29+) is the best command-surface primitive** — a
  deterministic full-surface JSON dump, independent of local config. Two
  independent `npx` dumps are byte-identical, so `diff -u` on snapshots is
  reliable. It does not exist before 0.6.29, so `manifest-diff` needs a stored
  snapshot (created by `mark-synced`).

## Troubleshooting

- `ERROR: no commit introduces version X` — the version was skipped on that ref
  (npm-only bump) or you passed a range; find the real npm version with
  `npm view @teable/cli version` and pass `--from`/`mark-synced` with it.
- `check` prints `BAD LINK`/`BAD ANCHOR` with file → target; anchors are
  compared against GitHub-slugified headings (backticks stripped, `&`/`/`
  removed producing double hyphens, e.g. `Node & Folder` →
  `node--folder-management`).
- `manifest dump for X failed` — no npm network, or the version predates the
  manifest command (< 0.6.29).
