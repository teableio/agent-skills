# Agent Skills

A collection of agent skills for AI coding assistants. Skills extend agent capabilities with specialized knowledge, workflows, and tool integrations.

## Skills

| Skill | Description |
| ----- | ----------- |
| [teable-assistant-ops](skills/teable-assistant-ops) | Operate Teable bases, tables, fields, views, records, SQL queries, and automations with a safe read-before-write process. |

## Quick Start (AI Agent)

> The following steps are for AI agents. Some steps require the user to complete actions in a browser.

### Step 1 — Install skill

```bash
npx skills add https://github.com/teableio/agent-skills
```

### Step 2 — Install Teable CLI and authenticate

> Run this from the installed `teable-assistant-ops` skill directory. The script installs or upgrades `@teable/cli`, then proactively starts CLI browser authentication when no valid login is found. If an authorization URL is printed, extract it and send it to the user.

```bash
bash scripts/install.sh
```

### Step 3 — Verify

```bash
teable --version
teable auth status
```

## Usage

Install via the skills CLI:

```bash
npx skills add https://github.com/teableio/agent-skills
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
