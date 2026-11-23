# Teable plugin

The Teable plugin for Claude Code, Codex and ChatGPT: [Teable](https://teable.ai)'s hosted MCP
server (`https://mcp.teable.ai/mcp`) plus the Teable agent skills. Every request runs as you,
with the permissions you approve on Teable's sign-in screen.

Some features hand work to AI models that Teable operates: AI fields, routines, App Builder and
the AI steps in apps and automations. For those, Teable's models, not Claude, write the results.

| Skill | What it does |
| --- | --- |
| [teable-assistant-ops](skills/teable-assistant-ops) | Operate Teable projects, tables, fields, views, records, SQL queries, automations and apps through the `teable` CLI. |
| [teable-app-builder](skills/teable-app-builder) | Build, change and publish Teable apps from your machine with the `teable` CLI. |

Install instructions, the MCP tool list and self-hosted setup are in the
[repository README](https://github.com/teableio/agent-skills#readme).
Support: [open an issue](https://github.com/teableio/agent-skills/issues) or email
support@teable.ai.
