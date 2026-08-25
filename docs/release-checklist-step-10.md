# Release Checklist - Step 10

## Calidad técnica
- [ ] Ruff OK (backend)
- [ ] Tests backend OK
- [ ] Tests frontend/integración OK
- [ ] Build frontend OK

## RBAC crítico
- [ ] Admin ve y usa Ajustar inventario
- [ ] Viewer no ve Ajustar inventario
- [ ] Viewer bloqueado en /users
- [ ] /api/modules/inventory/adjust/ devuelve 403 para Viewer

## Auth / sesión
- [ ] /api/me -> 200 con sesión válida
- [ ] /api/me -> 401 sin sesión
- [ ] /api/me/permissions -> 200 con active_company_id
- [ ] UX consistente para 401/403

## Smoke manual
- [ ] Login
- [ ] Logout
- [ ] Cambio de empresa activa
- [ ] Inventario (lectura)
- [ ] Auditoría visible según rol