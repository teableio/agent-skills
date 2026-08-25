# Sandbox Tool Persistence Guide

Use `teable sandbox tool` only inside Teable-managed sandboxes. It records reproducible setup and preserves selected `$HOME` state across rebuilds; it is not a general local CLI package manager.

## Persistence Workflow

1. Record a tool with `upsert`; use a stable name and pin versions in its setup command.
2. Persist only state/config directories that must survive rebuilds. Paths are `$HOME`-relative, accumulate across later upserts, and can belong to only one tool.
3. After a rebuild, run setup before first use. Persisted paths are already relinked, but setup commands never run automatically.

```bash
teable sandbox tool upsert --name my-tool --command "npm install -g my-tool@1.2.3" --path ~/.my-tool
teable sandbox tool setup my-tool
```

Use another upsert to modify a record without discarding state. Common `~/.<name>`, `~/.local/share/<name>`, and `~/.local/state/<name>` directories may be detected automatically, but list the record afterward to verify what will persist.

Reference provisioned environment variables in setup commands; never store secret values in the command itself.

`tool delete` is destructive: it removes the setup record, persisted state, and corresponding symlinks. Use it only when the state should also be discarded.
