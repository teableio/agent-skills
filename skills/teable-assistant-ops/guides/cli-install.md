# CLI Installation Guide

## Prerequisites

- Node.js >= 18

## Install

Install globally via npm:

```bash
npm install -g @teable/cli
```

## Choosing the endpoint

`https://app.teable.ai` is only the Cloud default. Self-hosted, CN-site, and custom-domain instances authenticate against their own origin. Resolve the endpoint in this order:

1. The origin embedded in the skill install prompt (Teable's in-app prompt includes it) or stated by the user.
2. An already-configured endpoint — check `teable auth status`.
3. Otherwise ask the user for their Teable instance URL — never silently fall back to `app.teable.ai`.

Then authenticate explicitly with `--endpoint <origin>`.

## Authentication

Two ways to authenticate:

### Option 1: Browser login (recommended)

```bash
teable auth login
```

Opens a browser for OAuth login (Authorization Code + PKCE). No token needed — credentials are saved automatically.

Options:
- `--endpoint` — Teable server URL (default: `https://app.teable.ai`)
- `--device-code` — device authorization grant for environments where the local OAuth callback can never arrive (cloud IDE, SSH session, container): the CLI prints a URL plus a one-time code, the user approves in a browser on any device, and the CLI polls until tokens are issued

```bash
# No reachable local callback port (SSH / container / cloud IDE)
teable auth login --device-code
```

### Option 2: Personal Access Token

```bash
teable auth --token <your-personal-access-token> --endpoint https://app.teable.ai
```

Options:
- `--token` — Teable Personal Access Token (PAT), also settable via `TEABLE_TOKEN` or `TEABLE_PAT` env vars
- `--endpoint` — Teable server URL (default: `https://app.teable.ai`), also settable via `TEABLE_ENDPOINT` env var
- `--force` — overwrite existing config
- `--path <dir>` — takes a **directory**, writes `<dir>/.teable/cli/config.json` (e.g. `--path .` for a project-level config)

### Auth management

```bash
# Check current auth status
teable auth status

# Clear saved credentials
teable auth logout
```

Auth config is saved to `~/.teable/cli/config.json` by default.

## Getting a Personal Access Token

1. Log in to your Teable instance (e.g. https://app.teable.ai)
2. Go to **Settings** → **Personal Access Tokens**
3. Click **Create new token**, give it a name, and copy the generated token
4. Use it with `teable auth --token teable_pat_xxx`

## Configuration

Config is loaded in this order (later overrides earlier):

1. **User-level**: `~/.teable/cli/config.json`
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
teable table get
```
