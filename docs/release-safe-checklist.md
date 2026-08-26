 # Release-safe checklist (minimum) — 2026-08-26

## Scope
Backend hardening for tenant isolation, CI gating, and merge safety on `master`.

## Status

- [x] Tenant isolation hardening merged (`feat/tenant-scope-min-hardening`)
- [x] CI backend gate merged (`chore/backend-ci-hardening`)
- [x] Branch protection enabled on `master`
  - [x] PR required before merge
  - [x] At least 1 approval required
  - [x] Dismiss stale approvals
  - [x] Required status check: `test-backend`
  - [x] Branches must be up to date before merge
  - [x] Conversation resolution required
  - [x] Linear history enabled
  - [x] Force pushes blocked
  - [x] Branch deletion blocked
- [x] Tenant enforcement helper in critical paths (`require_company_membership`)
- [x] Lint passing (`ruff check .`)
- [x] Tests passing (`pytest -q`)

## Evidence (session)

- `ruff check .` → All checks passed
- `pytest -q` → 24 passed in ~30s
- Branch protection rule edited and saved with required check `test-backend`
- `require_company_membership` usage confirmed in:
  - `accounts/views_permissions.py`
  - `core/views.py`
  - `core/company_context.py`

## Follow-ups (next hardening pass)

- [ ] Add/verify tenant-scoped tests for any newly added endpoints
- [ ] Add negative tests for missing/invalid `X-Company-Id` where applicable
- [ ] Optional: enforce CODEOWNERS review for sensitive backend modules