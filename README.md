# Teable Agent Skills

Agent skills and the plugin for [Teable](https://teable.ai), an AI spreadsheet for business.
One repository serves every way of installing them:

- the **Teable plugin** for Claude Code, Codex and ChatGPT: the skills below plus Teable's
  hosted MCP server, in one install;
- the **skills on their own**, through `npx skills add`, for any agent that reads the
  [Agent Skills](https://agentskills.io/) format.

## Skills

| Skill | Description |
| ----- | ----------- |
| [teable-assistant-ops](skills/teable-assistant-ops) | Operate Teable projects, tables, fields, views, records, SQL queries, and automations with a safe read-before-write process. |
| [teable-app-builder](skills/teable-app-builder) | Build, change and publish Teable apps from your machine with the `teable` CLI: `teable app init\|clone` for a local checkout, the dev loop, `teable app push` to record versions, `publish`, versions and rollback. |

Both skills call the [`@teable/cli`](https://www.npmjs.com/package/@teable/cli), which signs
in through the browser. When the Teable MCP tools are also available, the skills use them to
find projects and tables and to read and change records.

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

## Install the plugin

The plugin points at Teable's hosted MCP server, `https://mcp.teable.ai/mcp`
(Streamable HTTP, OAuth 2.1). There is nothing to run locally and no API key to paste:
the first time a tool is used, your client opens Teable's sign-in and consent page.

### Claude Code

```bash
claude plugin marketplace add teableio/agent-skills
claude plugin install teable@teable
```

Or the MCP server alone: `claude mcp add --transport http teable https://mcp.teable.ai/mcp`.
Then run `/mcp` and choose **Authenticate**.

### Codex

```bash
codex plugin marketplace add teableio/agent-skills
codex plugin add teable@teable
codex mcp login teable
```

Or add the server directly to `~/.codex/config.toml`:

```toml
[mcp_servers.teable]
url = "https://mcp.teable.ai/mcp"
```

### Cursor, VS Code and other MCP clients

```json
{
  "mcpServers": {
    "teable": { "url": "https://mcp.teable.ai/mcp" }
  }
}
```

Clients without a browser (CI, scripts) can send a personal access token instead:
create one in Teable under **Settings → Personal access tokens** and pass it as
`Authorization: Bearer <token>`.

Teable also lists every option, with copyable snippets, under **Settings → MCP**.

## MCP tools

| Tool | What it does | Changes data |
| --- | --- | --- |
| `list-bases` | List the projects (bases) you can access | No |
| `get-tables-meta` | List the tables in a project | No |
| `get-fields` | Field definitions of a table | No |
| `get-records` | Query records with filters, sorting and projections | No |
| `sql-query` | Run a read-only SQL `SELECT` across a project's tables | No |
| `get-doc` | Teable reference docs: filter, formula, link-field formats | No |
| `search-api` | Find an endpoint in the [Teable REST API](https://help.teable.ai/en/api-doc/overview) | No |
| `call-api-read` | Call a `GET` endpoint of the Teable API | No |
| `create-records` | Create records | Yes |
| `update-records` | Update records | Yes |
| `delete-records` | Delete records | Yes (destructive) |
| `call-api-write` | Call a `POST`/`PUT`/`PATCH`/`DELETE` endpoint of the Teable API | Yes (destructive) |

Tools that change data are annotated as such, so your client asks for confirmation
before running them. Which tools appear depends on the permissions you grant: a
read-only grant hides every tool that writes.

## Self-hosted Teable

The same server ships with every Teable deployment at `<your Teable URL>/mcp`. Point
any client above at that URL instead of `mcp.teable.ai`.

## Privacy, terms and support

- Privacy: <https://teable.ai/mcp-terms#privacy>
- Terms: <https://teable.ai/mcp-terms#terms>
- Support: [open an issue](https://github.com/teableio/agent-skills/issues) or email
  [support@teable.ai](mailto:support@teable.ai)

## Structure

The repository root is the plugin, so the skills keep one location for every installer.

```
.claude-plugin/
  marketplace.json                  Claude Code marketplace
  plugin.json                       Claude plugin manifest
.codex-plugin/plugin.json           Codex / OpenAI manifest, with listing and review metadata
.agents/plugins/marketplace.json    Codex marketplace
.mcp.json                           The MCP server, shared by all clients
assets/                             Logo and composer icon
skills/
└── <skill-name>/
    ├── SKILL.md           # Skill definition (entry point for agents)
    ├── api-reference/     # API documentation (optional)
    ├── guides/            # Usage guides (optional)
    ├── references/        # Detail loaded on demand (optional)
    └── metadata.json      # Version and metadata (optional)
scripts/package-openai.sh           Builds the ZIP uploaded to the OpenAI plugin portal
```

Each skill follows the [Agent Skills](https://agentskills.io/) format:

- **`SKILL.md`** is the entry point that agents read first. It contains frontmatter (name, description) and instructions.
- Supporting files (API references, guides, rules) provide detailed knowledge that agents load on demand.

The MCP server itself lives in the Teable codebase; this repository only describes how
clients reach it.

## Contributing

See [AGENTS.md](AGENTS.md) for contributor guidelines.

## License

MIT
