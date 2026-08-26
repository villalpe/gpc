## Summary
Describe briefly what this PR changes and why.

## Type of change
- [ ] feat
- [ ] fix
- [ ] docs
- [ ] chore
- [ ] refactor
- [ ] test

## Multi-tenant impact (required)
- [ ] No tenant-sensitive code touched
- [ ] Tenant-sensitive code touched and `X-Company-Id` enforcement verified
- [ ] Queries scoped by `company_id` verified
- [ ] Cross-tenant isolation validated (A cannot access B)

If applicable, list affected endpoints/modules:
- `...`

## Security & permissions
- [ ] Authentication flow unchanged
- [ ] Authorization rules reviewed
- [ ] 401/403 behavior verified
- [ ] Audit event required for this change (if yes, documented/implemented)

## Testing
- [ ] `ruff check .` passed
- [ ] `pytest -q` passed
- [ ] Added/updated tests for changed behavior
- [ ] Smoke-tested critical flow locally

Test evidence (paste short output):
```bash
# ruff / pytest summary here
```

## Staging impact
- [ ] No staging impact
- [ ] Requires env var changes
- [ ] Requires migration
- [ ] Requires data backfill
- [ ] Requires coordinated deploy step

Staging validation notes:
- URL tested:
- Basic flow tested:

## Checklist before merge
- [ ] PR title follows convention (`feat(scope): ...`, `fix(scope): ...`)
- [ ] Docs updated (README/CONTRIBUTING/docs) if needed
- [ ] CI checks green
- [ ] Ready for **Squash and merge**