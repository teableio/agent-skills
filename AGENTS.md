# Contributor Guide

This repository contains a collection of agent skills. Follow these guidelines when contributing.

## Repository Structure

```
skills/
└── <skill-name>/
    ├── SKILL.md           # Required: skill definition with frontmatter
    ├── api-reference/     # Optional: API documentation files
    ├── guides/            # Optional: usage guides
    ├── rules/             # Optional: rule files for compiled skills
    └── metadata.json      # Optional: version and metadata
```

## Creating a New Skill

1. Create a new directory under `skills/` with a descriptive kebab-case name
2. Add a `SKILL.md` file with the required frontmatter:

```yaml
---
name: my-skill-name
description: >-
  A concise description of what the skill does and when to use it.
---
```

3. Add supporting files as needed (API references, guides, rules)

## SKILL.md Requirements

- Must include `name` and `description` in YAML frontmatter
- Description should clearly state when the skill should be activated
- Instructions should be concise and action-oriented
- Reference supporting files using relative paths

## File Organization

- **api-reference/**: One file per API area (e.g., `field.basic.md`, `view.filter.md`)
- **guides/**: Workflow guides and CLI references
- **rules/**: Individual rule files with frontmatter (for compiled skills)

## Quality Checklist

- [ ] SKILL.md has valid frontmatter with name and description
- [ ] All relative links in SKILL.md resolve correctly
- [ ] Supporting files are well-organized and follow naming conventions
- [ ] No sensitive data (API keys, tokens, credentials) in any files

## Automated CLI doc sync (teable-assistant-ops)

When `@teable/cli` is published (dist-tag `latest`), teable-enterprise's
`publish-cli.yaml` sends a `cli-published` repository_dispatch to this repo with
`{version, source_ref}`. The `sync-cli-docs` workflow then:

1. installs the published CLI and runs the hidden `teable manifest` command
   (deterministic JSON of the full command surface, teable-ee#3155);
2. diffs it against the committed snapshot `.github/teable-cli-manifest.json`
   via `scripts/diff-cli-manifest.mjs` — **an empty diff ends the run** (patch
   releases with no surface change never open a PR);
3. on a non-empty diff, runs the [pi coding agent](https://pi.dev) against an
   OpenAI-compatible endpoint to update the skill docs, then opens/updates a PR
   on the fixed branch `bot/sync-cli-docs` (a newer release supersedes an
   unmerged sync PR). **Sync PRs are always human-reviewed before merge.**

`validate-skill-docs` CI checks every documented `teable` invocation (fenced
shell blocks and inline `` `teable ...` `` spans) against the manifest snapshot
via `scripts/validate-cli-docs.mjs`, so hallucinated commands or flags cannot
land. Add `no-validate` to a fence's info string (```` ```bash no-validate ````)
to exempt a deliberately illustrative block.

Configuration (repo secrets/variables):

| Name | Required | Purpose |
|------|----------|---------|
| `PI_BASE_URL` | yes | OpenAI-compatible endpoint base URL (secret or variable) |
| `PI_API_KEY` | yes (secret) | API key for that endpoint |
| `PI_MODEL` | yes | Model id at that endpoint (variable or secret) |
| `SYNC_GITHUB_TOKEN` | recommended | PAT/App token for opening the PR so CI runs on it (default `github.token` PRs trigger no workflows) |
| `TEABLE_EE_READ_TOKEN` | optional | Read access to teable-ee for commit-log context |

Bootstrap: until the first manifest-capable CLI (≥0.6.29) is published there is
no snapshot; the first sync run treats that as a full diff and opens a
one-time full-audit PR. The validator skips silently while the snapshot is
absent. To trigger a sync manually, run the `sync-cli-docs` workflow with a
version input.

### Comment-driven fixes (`/pi`)

On any PR, a maintainer (OWNER/MEMBER/COLLABORATOR) can comment
`/pi <instruction>` — top-level or as an inline review comment (inline carries
the file/line/diff context to the agent). The `pi-pr-assistant` workflow applies
the requested change to the PR branch, runs the doc validator (a failing
validation is reported instead of pushed), pushes, and replies on the PR.
Comments from other users, fork PRs, and comments not starting with `/pi` are
ignored. Note: GitHub runs comment-triggered workflows from the default branch,
so changes to this workflow only take effect after merging to main.
