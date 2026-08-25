# Authority Matrix Guide

Use the authority command group to manage advanced, role-based permissions for a base. It requires the Teable EE advanced-permissions feature and Base Owner/Creator access.

## How the Matrix Works

- The matrix governs every collaborator except the base Owner and matrix admins.
- A user assigned to multiple enabled roles receives the union of their grants; the most permissive grant wins.
- An unassigned user receives the configured default role. If there is no default role, that user loses access when the matrix is enabled.
- Roles grant access table by table. A table omitted from a role's `permissions` array is invisible to that role's members.
- The maximum grant is platform Editor access. Matrix roles cannot create or delete tables or fields, or share views.
- The matrix enabled/disabled state is separate from its declarative config. Exporting and applying config never enables or disables it.

## Available Commands

| Command | Purpose |
|---------|---------|
| `authority get` | Inspect matrix state, default role, and admins |
| `authority export` | Export the full config or one role to a declarative JSON file |
| `authority diff` | Compare an edited config with live state without writing |
| `authority apply` | Reconcile live state to an edited config |
| `authority enable` | Turn on matrix enforcement |
| `authority disable` | Turn off enforcement while preserving config |
| `authority role-list` | List roles and their assigned users/departments |
| `authority role-get` | Inspect one role's members, table grants, and node access |
| `authority role-delete` | Permanently delete a non-default role and its permissions |
| `authority role-duplicate` | Copy a role's permissions, optionally including members |

## Inspect the Matrix and Roles

Start by checking the matrix and listing roles:

```bash
teable authority get --base-id bseXXXX --pretty
teable authority role-list --base-id bseXXXX --pretty
teable authority role-get --base-id bseXXXX --role-id aurXXXX --pretty
```

`authority get` returns the matrix ID, `enabledTime`, `defaultRole`, and `adminUsers`. An empty response means the matrix has never been configured for the base. `authority role-list` includes user and department assignments; use `authority role-get` for the selected role's complete intent view: enabled state, members, table grants, and automation/app node access.

Use raw output only when the underlying API `disabledActions` representation is specifically needed:

```bash
teable authority role-get --base-id bseXXXX --role-id aurXXXX --raw --pretty
```

Do not edit grants directly from inspection output. Use the export workflow below.

## Safe Configuration Workflow

Every change to roles, grants, members, the default role, or admins should follow this sequence:

1. Export the current config.
2. Edit the exported file.
3. Run `authority diff` for a readable comparison.
4. Run `authority apply --dry-run` for the same preflight checks as apply, including any requested prune deletions.
5. Apply only after reviewing both previews.
6. Re-inspect the matrix or affected role.

```bash
teable authority export --base-id bseXXXX --file authority.json --pretty
# Edit authority.json.
teable authority diff --base-id bseXXXX --file authority.json --pretty
teable authority apply --base-id bseXXXX --file authority.json --dry-run --pretty
teable authority apply --base-id bseXXXX --file authority.json --pretty
teable authority get --base-id bseXXXX --pretty
```

`authority diff` never writes. It reports live roles absent from the file as `unmanagedRoles`, but it does not model deletion via `--prune`. The `authority apply --dry-run` preview is therefore mandatory before a pruned apply.

Apply is not atomic: operations run in order and stop at the first API error. Re-running the same apply is safe because completed changes no longer appear as differences.

### Scoped edits for one role

For a small role change, export only that role by ID or name:

```bash
teable authority export --base-id bseXXXX --role aurXXXX --file role.json --pretty
teable authority diff --base-id bseXXXX --file role.json --pretty
teable authority apply --base-id bseXXXX --file role.json --dry-run --pretty
teable authority apply --base-id bseXXXX --file role.json --pretty
```

A role-scoped export carries `"scope": "role"`, omits matrix-level keys, manages only that role, and cannot prune. Prefer this flow when the default role and admins should remain untouched.

### Managed keys and pruning

- A key absent from a config file remains unchanged.
- An explicit empty value such as `[]` or `null` is enforced.
- A full export includes every managed key; a hand-written partial file manages only the keys it contains.
- Roles absent from the file are retained by default.
- `--prune` permanently deletes live roles absent from a full-matrix file. It cannot be used with a role-scoped file.

Use prune only after reviewing the dry run:

```bash
teable authority apply --base-id bseXXXX --file authority.json --dry-run --prune --pretty
teable authority apply --base-id bseXXXX --file authority.json --prune --pretty
```

## Config and Grant Model

Always edit an exported file rather than constructing one from memory. A full config manages `defaultRole`, matrix `admins`, and `roles`. Each role includes its name, description, enabled state, user/department members, table `permissions`, and optional workflow/app `nodes`.

Each table grant requires a `tableId` and one access preset:

| Access | Capabilities |
|--------|--------------|
| `editor` | Record CRUD, comments, copy, view management, import, and export |
| `commenter` | Read, comment, copy, and export; no record or view changes |
| `viewer` | Read, copy, and export only |

A grant can further restrict access with:

- `deny`: remove specific actions from the preset.
- `views`: whitelist views; omit for all views, or use an empty array for none.
- `rowFilter`: limit visible rows using view-filter JSON. For a user-field current-user condition, the value is exactly `"Me"` with a capital M.
- `fields`: mark a field `hidden` or `read-only`, or disable selected record actions for it.
- `enabled: false`: retain the grant in storage without enforcing it.

Once field restrictions exist, newly added fields remain inaccessible until explicitly granted. Read the complete config shape, deny values, field modes, and filter behavior from the installed CLI help before editing complex grants:

```bash
teable authority export --help
```

Resolve user IDs with `get-collaborators`. Department memberships require an enterprise organization; discover the department API with `search-api` and call it with `call-api`.

## Enable and Disable Enforcement

Configure a safe default role before enabling the matrix. Enabling without one proceeds with a warning and removes access from unassigned collaborators.

```bash
teable authority enable --base-id bseXXXX --pretty
teable authority get --base-id bseXXXX --pretty
```

Disable enforcement when collaborators need to fall back to their plain base roles:

```bash
teable authority disable --base-id bseXXXX --pretty
```

Disabling preserves roles and grants; they take effect again when the matrix is re-enabled.

## Duplicate and Delete Roles

Duplicate a role to reuse its table and node permission config. Membership is not copied unless explicitly requested:

```bash
teable authority role-duplicate --base-id bseXXXX --role-id aurXXXX --name "Sales copy" --pretty
teable authority role-duplicate --base-id bseXXXX --role-id aurXXXX --name "Sales team copy" --include-users --include-departments --pretty
```

The result includes the new role ID. Inspect it before assigning it as a default role or enabling it broadly.

Delete only after confirming that members can safely fall back to the default role:

```bash
teable authority role-delete --base-id bseXXXX --role-id aurXXXX --pretty
```

Deleting a role permanently removes its permission config. The CLI refuses to delete the current default role; first repoint `defaultRole` through export, edit, diff, and apply.
