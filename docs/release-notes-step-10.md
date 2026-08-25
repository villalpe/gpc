# Release Notes - Step 10 (QA/RBAC hardening + UX 401/403)

## Fecha
2026-08-25

## Resumen
Se completó el endurecimiento de QA/RBAC en frontend y se estandarizó la UX para respuestas de autorización/autenticación (401/403), dejando una base estable para continuar con las siguientes fases.

## Entregables principales

### 1) Cobertura de pruebas frontend
- `apps/frontend/src/__tests__/rbac-inventory-spec.test.ts`
- `apps/frontend/src/__tests__/api-routes-authz.test.ts`

**Evidencia de ejecución:**
- Test Files: **2 passed (2)**
- Tests: **7 passed (7)**

### 2) Documentación de control RBAC y release
- `docs/rbac-matrix.md` (matriz de permisos restaurada y validada como archivo `.md`)
- `docs/release-checklist-step-10.md` (actualizado con evidencias y validaciones)

### 3) UX uniforme para 401/403
Cambios aplicados en:
- `apps/frontend/src/lib/apiFetch.ts`
- `apps/frontend/src/hooks/useMyPermissions.ts`
- `apps/frontend/src/components/authz/RequirePermissions.tsx`

**Comportamiento final:**
- **401**: sesión expirada/no válida → mensaje de sesión expirada + redirección a `/login`
- **403**: autenticado sin permiso → mensaje de “No autorizado para esta acción” (sin cerrar sesión)

## Validaciones funcionales realizadas
- Usuario sin sesión entra a `/users` → redirección a `/login` ✅
- Usuario con sesión pero sin permiso `users.invite` → ve “No autorizado para esta acción.” ✅
- Usuario con permiso `users.invite` → puede ver contenido de `/users` ✅

## Estado
- Pull Requests de Step 10 y UX hardening: **mergeados**
- Ramas de trabajo: **eliminadas (local/remoto)**
- `master`: **actualizado y limpio**