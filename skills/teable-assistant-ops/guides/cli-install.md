# CLI Installation Guide

## Prerequisites

- Node.js >= 18

## Install

Install globally via npm:

```bash
npm install -g @teable/ai-tools-cli
```

Or use npx to run without installing:

```bash
npx @teable/ai-tools-cli <command>
```

## Authentication

Run `auth` to configure your token and endpoint:

```bash
teable-ai-tools auth --token <your-personal-access-token> --endpoint https://app.teable.ai
```

Options:
- `--token` — Teable Personal Access Token (PAT), also settable via `TEABLE_TOKEN` or `TEABLE_PAT` env vars
- `--endpoint` — Teable server URL (default: `https://app.teable.ai`), also settable via `TEABLE_ENDPOINT` env var
- `--force` — overwrite existing config
- `--path <file>` — save config to a custom path

Auth config is saved to `~/.teable-ai-tools/config.json` by default.

Check current auth status:

```bash
teable-ai-tools auth status
```

## Getting a Personal Access Token

1. Log in to your Teable instance (e.g. https://app.teable.ai)
2. Go to **Settings** → **Personal Access Tokens**
3. Click **Create new token**, give it a name, and copy the generated token
4. Use it with `teable-ai-tools auth --token teable_pat_xxx`

## Configuration

Config is loaded in this order (later overrides earlier):

1. **User-level**: `~/.teable-ai-tools/config.json`
2. **Project-level** (optional): `teable-ai-tools.config.json` or `.teable-ai-toolsrc.json` in current directory

Example config file:

```json
{
  "token": "teable_pat_xxx",
  "endpoint": "https://app.teable.ai"
}
```

## Verify Installation

```bash
# Check version
teable-ai-tools --version

# Check auth
teable-ai-tools auth status

# List tables in a base
teable-ai-tools get-tables-meta --base-id bseXXX
```
