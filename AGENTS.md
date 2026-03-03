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
