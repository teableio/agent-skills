# Operation Preview Guide

Use canonical previews before supported destructive or non-obvious writes. A preview does not execute the write or grant permission.

## Read → preview → decide → write

1. Read current state and run `teable operation capabilities`. Match the intended write to `operation`, `canonicalWriteRoute`, `supportLevel`, `detailLevels`, `requiredPermissionScope`, and limitations. Never invent preview support for an absent operation.
2. For supported destructive/non-obvious writes, preview the same operation-specific input the existing write will receive. Explain partial or validation-only coverage rather than presenting it as a full impact assessment.
3. Inspect outcome, blockers, warnings, effects, `coverage.unknown`, unknown measures, and capability limitations. **Blocked forbids the write**; incomplete or unresolved product-impact uncertainty requires product confirmation first.
4. Only after examining the preview and obtaining required confirmation, invoke the existing write command. Re-read to verify the result.

Example request shape (discover support before using it):

```bash
teable operation preview --request '{"operation":"table.delete","input":{"tableId":"tblXXX"},"options":{"detail":"full"}}' --pretty
```

## Pitfalls

| Pitfall | Safer decision |
|---------|----------------|
| Low complexity score or empty effects interpreted as safe | Neither proves low/no impact; inspect coverage and limitations |
| Treating a nonzero exit as missing output | Read the canonical `{ok:true,data}` / `{ok:false,error}` DTO on stdout and stable error on stderr; blocked/incomplete outcomes also exit 1, ready exits 0 |
| Preview used as authorization | Authentication and authorization remain host-owned |
| No advertised preview support | Do not claim safety; retain read-before-write checks and explain unknown impact before seeking confirmation |
