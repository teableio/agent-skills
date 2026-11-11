# Agent Skills

> **This repository has moved.** Teable's agent skills now live in
> [teableio/teable-mcp](https://github.com/teableio/teable-mcp), next to the Teable plugin and MCP server.
> The copy here is frozen at Teable CLI 0.6.45 and no longer updated.

## Install the current skills

```bash
npx skills add https://github.com/teableio/teable-mcp
```

That installs `teable-assistant-ops` (operate Teable projects with the `teable` CLI) and
`teable-app-builder` (build Teable apps from a local checkout). On Claude Code and Codex you can
install the Teable plugin instead, which adds the MCP server as well; see the
[teable-mcp README](https://github.com/teableio/teable-mcp#readme).

## For AI agents

If you were asked to read this repository and install the Teable agent skill, follow
[Setting up the skills from an agent](https://github.com/teableio/teable-mcp#setting-up-the-skills-from-an-agent)
in the new repository instead: install from there, then run the CLI install script and verify
sign-in as described.

## If you installed from here before

Run the install command above to switch to the maintained copy, then remove the old
`teable-assistant-ops` if your agent keeps both.

## What is left here

`skills/teable-assistant-ops` stays so that existing install commands keep working. It is not
synced with new CLI releases. Report problems at
[teableio/teable-mcp issues](https://github.com/teableio/teable-mcp/issues).

## License

MIT
