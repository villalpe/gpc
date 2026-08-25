# Release Checklist - Step 10

## Calidad técnica
- [ ] Ruff OK (backend)
- [ ] Tests backend OK
- [x] Tests frontend/integración OK *(7/7 passing: `rbac-inventory-spec` + `api-routes-authz`)*
- [ ] Build frontend OK

## RBAC crítico
- [x] Admin ve y usa Ajustar inventario *(validado previamente en flujo E2E manual)*
- [x] Viewer no ve Ajustar inventario *(validado previamente)*
- [x] Viewer bloqueado en /users *(validado previamente)*
- [x] /api/modules/inventory/adjust/ devuelve 403 para Viewer *(validado previamente)*

## Auth / sesión
- [x] /api/me -> 401/403 sin sesión *(test integración)*
- [x] /api/me/permissions -> falla controlada sin contexto válido *(400/401/403 en test integración)*
- [x] /api/modules/inventory/ping/ -> responde según contexto de auth *(200/401/403 en test integración)*
- [ ] /api/me -> 200 con sesión válida
- [ ] /api/me/permissions -> 200 con active_company_id
- [ ] UX consistente para 401/403

## Smoke manual
- [x] Login
- [x] Logout
- [x] Cambio de empresa activa
- [x] Inventario (lectura)
- [x] Auditoría visible según rol

## Evidencia adjunta sugerida en PR
- [ ] Salida de tests frontend: `Test Files 2 passed`, `Tests 7 passed`
- [ ] Referencia a `docs/rbac-matrix.md`
- [ ] Nota de validaciones manuales Admin vs Viewer