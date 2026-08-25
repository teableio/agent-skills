# Authority Matrix Guide

Use the authority matrix only for advanced, role-based base permissions. It requires the Teable EE advanced-permissions feature and Base Owner/Creator access.

## Decision Rules

- The matrix governs collaborators except the base Owner and matrix admins.
- Grants from all enabled roles assigned to a user are unioned; the most permissive grant wins. Do not use a second role to subtract access.
- Unassigned collaborators inherit the default role. Without one, they lose access when enforcement is enabled.
- Access is granted table by table: omitting a table makes it invisible to that role.
- Matrix permissions top out at platform Editor; they cannot grant schema changes or view sharing.
- Configuration and enforcement state are separate. Applying a config does not enable or disable the matrix.

## Safe Change Workflow

Always change grants, members, roles, admins, and the default role through an exported config:

1. Inspect the current matrix and affected role.
2. Export, then edit the exported file rather than constructing config from memory.
3. Run `authority diff` to review the semantic change.
4. Run `authority apply --dry-run`; this is mandatory when pruning because diff does not model deletions.
5. Apply only after both previews are acceptable, then inspect the live result.

For a small role-only edit, export that role. The resulting scoped file cannot change matrix-level settings or prune other roles:

```bash
teable authority export --base-id bseXXXX --role aurXXXX --file role.json
teable authority diff --base-id bseXXXX --file role.json
teable authority apply --base-id bseXXXX --file role.json --dry-run
teable authority apply --base-id bseXXXX --file role.json
```

For matrix-wide changes, omit `--role`. In either scope:

- Missing keys are unmanaged and remain unchanged; explicit `[]` or `null` values are enforced.
- Live roles missing from a full config remain unless `--prune` is used. Prune permanently deletes them and is invalid for role-scoped files.
- Apply is not atomic and stops at the first API error. Reinspect after failure; rerunning the same apply safely resumes reconciliation.

## Grant Pitfalls

- Prefer an access preset, then narrow it. Run `teable authority export --help` for the current config shape, deny values, field modes, and filter details.
- A view list is a whitelist: omission means all views, while an empty list means none.
- Once a role has field restrictions, newly created fields remain inaccessible until explicitly granted.
- Current-user conditions on user fields require the exact value `"Me"`; lowercase `"me"` is ordinary text and matches nothing.
- Resolve users with `get-collaborators`. Department assignment requires an enterprise organization; discover the department endpoint with `search-api` before using `call-api`.

## Enforcement and Destructive Operations

Set and verify a safe default role before `authority enable`; otherwise unassigned collaborators lose access. `authority disable` restores plain base-role behavior while preserving matrix configuration.

Before deleting or duplicating a role, inspect its members and effective fallback. Duplication copies permissions but not membership unless explicitly requested. Role deletion permanently removes its permission config; the default role must be repointed through the export workflow before it can be deleted.
