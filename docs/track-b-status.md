# Track B — Estado final (CLOSED)

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-09-12  
**Entorno de cierre:** Staging (Render)  
**Base URL:** `https://gpc-rse7.onrender.com`

---

## Resumen ejecutivo
Track B quedó cerrado con validación funcional completa en staging para:
- autenticación JWT,
- enforcement de tenant por header `X-Company-Id`,
- control de membresía por compañía,
- control de permisos por módulo (RBAC),
- respuestas 4xx controladas en casos negativos (sin 500 en flujos críticos validados).

---

## Alcance completado

1. **Tenancy enforcement** ✅
   - `company_scope_ping` estabilizado.
   - Casos validados en staging:
     - Sin token → 401
     - Token + sin `X-Company-Id` → 400
     - Token + `X-Company-Id` inválido → 400
     - Token + `X-Company-Id` válido sin membresía → 403
     - Token + `X-Company-Id` válido con membresía → 200

2. **Permisos por módulo (RBAC mínimo)** ✅
   - `inventory` y `audit` ping operativos con usuario autorizado.
   - `inventory.adjust`:
     - usuario autorizado → 200
     - usuario limitado (sin permiso) → 403

3. **Auth y contexto de usuario** ✅
   - `/api/token/` emite JWT en staging.
   - `/api/me/roles/` y `/api/me/permissions/` devuelven datos consistentes.

4. **Staging compartible** ✅
   - Deploy `Live` estable en Render.
   - Smoke tests ejecutados y documentados en runbook.

5. **Calidad base** ✅
   - `ruff check .` en verde.
   - `pytest -q` en verde.
   - Flujo PR/checks requerido mantenido.

---

## Incidencias relevantes resueltas

### 1) DB apuntando a localhost en Render
- **Síntoma:** `OperationalError` a `127.0.0.1:5432`.
- **Causa raíz:** settings sin consumo efectivo de `DATABASE_URL`.
- **Resolución:** ajuste de configuración para priorizar `DATABASE_URL` en staging + redeploy.
- **Resultado:** migraciones/shell/auth operativos en Render.

### 2) `/api/me/roles/` devolviendo lista vacía
- **Causa:** usuario autenticado sin membership activa en DB de staging.
- **Resolución:** creación de `Company` + `Membership` activa para admin.
- **Resultado:** roles y tenant context correctos.

---

## Evidencia consolidada (staging)

### Tenant/Auth core
- `GET /api/company/ping/` + token + company válida → **200**
- `GET /api/company/ping/` + token sin header → **400**
- `GET /api/company/ping/` sin token → **401**
- `GET /api/company/ping/` + token + UUID válido sin membresía → **403**

### Módulos
- `GET /api/modules/inventory/ping/` → **200**
- `GET /api/modules/audit/ping/` → **200**
- `POST /api/modules/inventory/adjust/` (usuario autorizado) → **200**
- `POST /api/modules/inventory/adjust/` (usuario limitado) → **403**

### Contexto usuario
- `GET /api/me/roles/` → **200** (incluye `ADMIN_COMPANY` en `gpc-demo`)
- `GET /api/me/permissions/` → **200** (incluye `audit.read`, `inventory.adjust`, `inventory.read`, `inventory.write`, `users.invite`)

---

## Entregables/documentación vinculada

- `CONTRIBUTING.md`
- `.github/pull_request_template.md`
- `docs/tenant-enforcement-checklist.md`
- `docs/audit-minimum-spec.md`
- `docs/staging-runbook.md`
- `docs/track-b-go-no-go-checklist.md`
- `docs/track-b-status.md` (este documento)

---

## Decisión formal de cierre

**GO ✅ — Track B Ready to close**  
Se aprueba cierre de Track B con evidencia suficiente de estabilidad funcional y controles mínimos de seguridad/tenancy en staging.

---

## Notas post-cierre (mejora continua, no bloqueantes)

- Mantener corrida periódica de smoke tests en staging tras cambios de permisos/tenancy.
- Ampliar cobertura de pruebas automatizadas por endpoint tenant-sensitive conforme crezca el dominio.
- Preservar trazabilidad de evidencias por fecha en el runbook.