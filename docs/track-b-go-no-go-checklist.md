# Track B — Go/No-Go Checklist (Ready to close)

**Fecha objetivo de cierre:** 2026-09-12  
**Entorno:** Staging (Render)  
**Base URL:** `https://gpc-rse7.onrender.com`

---

## 1) Calidad de código (master)

- [x] `ruff check .` en verde
- [x] `pytest -q` en verde
- [ ] No hay tests flaky conocidos en módulos críticos (auth/tenant/inventory/audit/quotes)
- [x] Último commit en `master` con checks obligatorios verdes en PR

**Estado:** Parcialmente completo (solo pendiente validación explícita de flaky tests).  
**GO criterio:** todo en verde sin bypass manual.

---

## 2) Infra/config de staging

- [x] Deploy en Render con estado `Live`
- [x] `DATABASE_URL` configurada y consumida por Django
- [x] No existen errores de conexión a `127.0.0.1:5432`
- [x] Migraciones aplicadas correctamente (`migrate` ok)
- [x] `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, CORS/CSRF configurados para staging

**Estado:** Completo.  
**GO criterio:** app estable, sin errores operativos de infraestructura.

---

## 3) Auth JWT en staging

- [x] `POST /api/token/` con credenciales válidas devuelve 200 y tokens
- [x] Token inválido/expirado devuelve 401/`token_not_valid` controlado (no 500)
- [x] `/api/me/roles/` devuelve 200 y roles esperados para usuario admin
- [x] `/api/me/permissions/` devuelve 200 y permisos esperados

**Estado:** Completo.  
**GO criterio:** autenticación y contexto de usuario confiables.

---

## 4) Tenancy enforcement (obligatorio)

### Endpoint de control tenant (`/api/company/ping/`)
- [x] Sin token → 401
- [x] Con token, sin `X-Company-Id` → 400
- [x] Con token, `X-Company-Id` inválido (formato) → 400
- [x] Con token, `X-Company-Id` válido con membresía → 200
- [ ] Con token, `X-Company-Id` válido **sin membresía** → 403 *(pendiente evidencia explícita en staging)*

### Endpoints tenant-sensitive críticos (ej. inventory/quotes/audit según alcance)
- [x] Requieren token (401 sin auth) *(validado en `company/ping`)*
- [x] Manejan correctamente header tenant cuando corresponde *(validado en `company/ping` e `inventory/adjust`)*
- [x] Filtran/actúan por `company_id` correcto *(evidencia positiva en `company/ping`)*
- [x] No presentan 500 ante inputs inválidos de tenant

**Estado:** Casi completo (falta evidencia del caso UUID válido sin membresía => 403).  
**GO criterio:** sin bypass de tenant y sin 500 en casos negativos.

---

## 5) Permisos por módulo

- [x] `GET /api/modules/inventory/ping/` → 200 con usuario autorizado
- [x] `GET /api/modules/audit/ping/` → 200 con usuario autorizado
- [x] `POST /api/modules/inventory/adjust/` funciona con permiso correcto
- [ ] Usuario sin permiso recibe 403 controlado (no 500) *(pendiente evidencia explícita con usuario limitado)*

**Estado:** Casi completo.  
**GO criterio:** RBAC mínimo operativo.

---

## 6) Auditoría mínima (Track B)

- [x] Eventos críticos definidos en `docs/audit-minimum-spec.md`
- [ ] Evidencia mínima disponible para flujos críticos (login/acción crítica/error)
- [ ] Endpoint(s) de auditoría no filtran datos fuera de tenant *(pendiente evidencia explícita)*
- [ ] Resultado de pruebas documentado

**Estado:** Parcial.  
**GO criterio:** trazabilidad mínima demostrable.

---

## 7) Documentación y evidencia

- [x] `docs/staging-runbook.md` actualizado con resultados reales
- [x] `docs/track-b-status.md` actualizado (estado y pendientes reales)
- [x] Evidencias Postman/capturas registradas (fecha, endpoint, status)
- [x] Lista de decisiones técnicas registrada (400 vs 403, etc.)

**Estado:** Completo.  
**GO criterio:** otra persona puede reproducir validación sin depender de contexto oral.

---

## 8) Criterio final de decisión

## ✅ GO — “Track B Ready to close”
Marcar **GO** solo si:
1. Secciones 1–5 completas sin fallas críticas.
2. Sección 6 cubierta al nivel mínimo acordado.
3. Sección 7 completa.
4. No hay P0/P1 abiertos relacionados con auth/tenant/data isolation.

## ❌ NO-GO
Si ocurre cualquiera:
- Cualquier 500 en rutas críticas de auth/tenant.
- Ambigüedad de aislamiento por company.
- Falta de evidencia verificable.
- Fallo de infraestructura no mitigado en staging.

---

## 9) Acta de cierre (llenado rápido)

- **Decisión:** **NO-GO (temporal, por pendientes de evidencia final)**
- **Fecha/hora:** 2026-09-12
- **Responsable:** Eduardo Villalpando
- **Commit SHA final:** _(llenar)_
- **Deploy Render:** `https://gpc-rse7.onrender.com` (Live)
- **Observaciones:** Base técnica estable; faltan 3 evidencias puntuales para declarar cierre formal.
- **Pendientes post-cierre (si GO):**
  1. Probar caso `X-Company-Id` UUID válido sin membresía => 403.
  2. Probar 403 por permisos con usuario sin `inventory.adjust`.
  3. Completar evidencia mínima de auditoría por flujos críticos.