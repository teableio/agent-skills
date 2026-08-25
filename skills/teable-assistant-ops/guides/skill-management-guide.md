# Skill Management Guide

Use `teable skill` to list, import, and enable or disable managed agent skills. Skill commands are scoped independently of the current Teable base.

## Scopes

`--scope-type` (alias `--scope`) accepts `user`, `base`, `space`, `system`, `app`, or `cuppyclaw`.

- Supply `--scope-id` for base and space imports.
- App and CuppyClaw operations require a scope ID, but may obtain it from `TEABLE_APP_ID` or `TEABLE_BOT_ID`.
- For `skill list --scope-type user`, optional `--base-id` also includes skills available from that base.

## List Skills

```bash
teable skill list --scope-type user
teable skill list --scope-type user --list-type available --base-id bseXXXX
teable skill list --scope-type app --scope-id appXXXX
```

`--list-type managed` (the default) returns full managed-skill details. Use `available` for skills exposed as chat slash commands.

## Import from GitHub

The URL must point to a skill folder through `/tree/<ref>/<path>` or `/blob/<ref>/<path>`; a plain repository URL is rejected.

```bash
teable skill import-github \
  --scope-type user \
  --url https://github.com/owner/repo/tree/main/skills/my-skill

teable skill import-github \
  --scope-type base \
  --scope-id bseXXXX \
  --url https://github.com/owner/repo/tree/main/skills/my-skill
```

## Import a Local Archive

Both `.skill` and `.zip` names are accepted, but the file content must be a valid ZIP archive.

```bash
teable skill import-file --scope-type user --file-path ./my-skill.skill
teable skill import-file --scope-type app --scope-id appXXXX --file-path ./my-skill.zip
```

## Enable or Disable a Skill

Find the `sklXXXX` ID with `skill list`, then update its enabled state:

```bash
teable skill update --skill-id sklXXXX --is-enabled true
teable skill update --skill-id sklXXXX --is-enabled false
```

`--is-enabled` is required and accepts `true` or `false`.
