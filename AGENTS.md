# Contributor Guide

This repository is frozen. Teable's agent skills, their contributor guide and the CLI doc sync
pipeline moved to [teableio/teable-mcp](https://github.com/teableio/teable-mcp); make changes there. The notes below describe
the layout of what remains.

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

## Writing Style for Skill Content

These files are **agent skills, not CLI manuals**. The reader is an AI agent
that can always run `teable <cmd> --help` at runtime, so:

- **Never restate what `--help` already says** — no flag inventories, no
  per-command syntax walkthroughs, no one-section-per-command structure.
- **Write the operational knowledge help cannot provide**: when to use which
  command, decision rules ("if you need X, use A; otherwise B"), cross-command
  workflows, prerequisites, pitfalls, value formats, safe defaults, and
  warnings for destructive operations.
- **Prefer pitfall tables and decision rules over command catalogs** (see the
  Common Pitfalls table in `cli-reference.md` for the house style).
- **Examples only where the invocation shape is non-obvious** — complex JSON
  payloads, quoting, multi-step sequences. Trivial invocations need none.
- **Brevity is a feature**: skill files are loaded into an agent's context
  window; every line costs tokens on every task that uses the skill.
- **The reader runs outside Teable-managed sandboxes**: this skill is consumed
  by agents operating `@teable/cli` in their own environment, never inside a
  Teable-managed agent sandbox. The manifest's `availability` markers
  (`managed-sandbox-disabled`, `sandbox-only`) describe runtime gating those
  readers never encounter — do not thread sandbox-conditional wording through
  the docs, and do not document sandbox-only command groups (e.g.
  `sandbox tool`).

## File Organization

- **api-reference/**: One file per API area (e.g., `field.basic.md`, `view.filter.md`)
- **guides/**: Workflow guides and CLI references. Each major topic or command
  group gets its own `<topic>-guide.md` (e.g., `automation-guide.md`,
  `app-builder-guide.md`), linked from SKILL.md. `cli-reference.md` is a
  cross-cutting quick reference — do not grow whole new subsystems inside it;
  create a dedicated guide instead.
- **rules/**: Individual rule files with frontmatter (for compiled skills)

Before adding or moving content, read SKILL.md (the module map) and survey the
existing files so new material lands where a reader would look for it.

## Quality Checklist

- [ ] SKILL.md has valid frontmatter with name and description
- [ ] All relative links in SKILL.md resolve correctly
- [ ] Supporting files are well-organized and follow naming conventions
- [ ] No sensitive data (API keys, tokens, credentials) in any files
