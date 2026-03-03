# Agent Skills

A collection of agent skills for AI coding assistants. Skills extend agent capabilities with specialized knowledge, workflows, and tool integrations.

## Skills

| Skill | Description |
| ----- | ----------- |
| [teable-assistant-ops](skills/teable-assistant-ops) | Operate Teable bases, tables, fields, views, records, SQL queries, and automations with a safe read-before-write process. |

## Usage

### Claude Code

Copy a skill folder into your project's `.claude/skills/` directory:

```bash
cp -r skills/teable-assistant-ops .claude/skills/
```

Or install via the skills CLI:

```bash
npx skills add <owner>/<repo>
```

### Claude.ai / Claude Desktop

Package the skill as a zip and upload it as project knowledge:

```bash
cd skills && zip -r teable-assistant-ops.zip teable-assistant-ops/
```

## Structure

```
skills/
└── <skill-name>/
    ├── SKILL.md           # Skill definition (entry point for agents)
    ├── api-reference/     # API documentation (optional)
    ├── guides/            # Usage guides (optional)
    ├── rules/             # Rule files compiled into AGENTS.md (optional)
    └── metadata.json      # Version and metadata (optional)
```

Each skill follows the [Agent Skills](https://agentskills.io/) format:

- **`SKILL.md`** is the entry point that agents read first. It contains frontmatter (name, description) and instructions.
- Supporting files (API references, guides, rules) provide detailed knowledge that agents load on demand.

## Contributing

See [AGENTS.md](AGENTS.md) for contributor guidelines.

## License

MIT
