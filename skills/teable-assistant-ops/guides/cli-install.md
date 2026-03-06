# CLI Installation Guide

## Prerequisites

- Node.js >= 18

## Install

Install globally via npm:

```bash
npm install -g @teable/cli
```

Or use npx to run without installing:

```bash
npx @teable/cli <command>
```

## Authentication

Two ways to authenticate:

### Option 1: Browser login (recommended)

```bash
teable auth login
```

Opens a browser for OAuth login (Authorization Code + PKCE). No token needed — credentials are saved automatically.

Options:
- `--endpoint` — Teable server URL (default: `https://app.teable.ai`)

### Option 2: Personal Access Token

```bash
teable auth --token <your-personal-access-token> --endpoint https://app.teable.ai
```

Options:
- `--token` — Teable Personal Access Token (PAT), also settable via `TEABLE_TOKEN` or `TEABLE_PAT` env vars
- `--endpoint` — Teable server URL (default: `https://app.teable.ai`), also settable via `TEABLE_ENDPOINT` env var
- `--force` — overwrite existing config
- `--path <file>` — save config to a custom path

### Auth management

```bash
# Check current auth status
teable auth status

# Clear saved credentials
teable auth logout
```

Auth config is saved to `~/.teable/config.json` by default.

## Getting a Personal Access Token

1. Log in to your Teable instance (e.g. https://app.teable.ai)
2. Go to **Settings** → **Personal Access Tokens**
3. Click **Create new token**, give it a name, and copy the generated token
4. Use it with `teable auth --token teable_pat_xxx`

## Configuration

Config is loaded in this order (later overrides earlier):

1. **User-level**: `~/.teable/config.json`
2. **Project-level** (optional): `teable.config.json` or `.teablerc.json` in current directory

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
teable --version

# Check auth
teable auth status

# List tables in a base
teable get-tables-meta
```
