# Sandbox Tool Persistence Guide

> **Availability:** `teable sandbox tool` is available only in Teable-managed sandboxes. Do not use these commands in a normal local CLI environment.

Use this group to preserve tool setup instructions and `$HOME` state across sandbox rebuilds. Persisted state directories are restored as symlinks, while setup commands run only when explicitly requested.

## Inspect Recorded Tools

```bash
teable sandbox tool list
```

The result includes each tool's setup command and persisted `$HOME`-relative paths.

## Record or Update a Tool

```bash
teable sandbox tool upsert \
  --name my-tool \
  --command "npm install -g my-tool@1.2.3" \
  --description "Processes project data" \
  --path ~/.my-tool
```

- The tool name is the upsert key; run `upsert` again to change it instead of deleting and re-adding it.
- `--command`, `--description`, and repeatable `--path` are individually optional, but always provide a useful description.
- Paths accumulate on later upserts. A persisted path belongs to exactly one recorded tool.
- Existing `~/.<name>`, `~/.local/share/<name>`, and `~/.local/state/<name>` directories are discovered automatically.
- Pin setup-command versions for reproducibility.
- Reference secrets as `$KEY` values provisioned with `teable env set`; never embed secret values in the recorded command.

## Restore a Tool after Rebuild

Recorded tools are not set up automatically. After a rebuild, run setup before first use:

```bash
teable sandbox tool setup my-tool
```

This executes the recorded command exactly. Persisted state has already been relinked at sandbox startup.

## Delete a Tool

```bash
teable sandbox tool delete my-tool
```

**Warning:** deletion removes both the setup record and its persisted state, and clears the corresponding symlinks. Use `upsert` for modifications so state is retained.
