# Tenant Isolation Checklist (Minimum Corporate Baseline)

## Fecha
2026-08-25

## Objetivo
Garantizar aislamiento lógico por `company_id` en endpoints críticos antes del avance de Corporate Website v1.

## Regla obligatoria
Todo endpoint de negocio que lea/escriba datos sensibles debe:
1. Requerir `X-Company-Id`
2. Validar formato (UUID)
3. Verificar membresía activa del usuario en esa compañía
4. Filtrar consultas por `company_id`

---

## Endpoints revisados

### 1) `GET /api/me/permissions/`
- **Estado:** ✅ OK (hardening aplicado)
- **Validaciones:**
  - Header faltante -> 400
  - Header inválido -> 400
  - Sin membresía activa -> 403
  - Con membresía activa -> 200
- **Notas:** ahora usa `require_company_membership(request)`.

### 2) `GET /api/me/`
- **Estado:** 🟡 Parcial
- **Observación:** devuelve perfil global del usuario.
- **Acción pendiente:** evaluar variante scoping por compañía activa cuando se requiera contexto corporativo en respuesta.

### 3) `GET /api/me/roles/`
- **Estado:** 🟡 Parcial
- **Observación:** lista roles activos del usuario en múltiples compañías.
- **Acción pendiente:** opcional filtrar por `X-Company-Id` (o crear endpoint `me/active-role`) para vistas estrictamente tenant-scoped.

### 4) `POST /api/modules/inventory/adjust/`
- **Estado:** 🔍 Pendiente de verificación de código
- **Revisar:** validación de membresía + filtro/operación por `company_id`.

### 5) `GET /api/modules/inventory/ping/`
- **Estado:** 🔍 Pendiente de verificación de código
- **Revisar:** requerimiento de scope por compañía (si aplica al módulo inventario productivo).

### 6) `GET /api/company/ping/`
- **Estado:** 🔍 Pendiente de verificación de código
- **Revisar:** uso consistente de `require_company_membership`.

---

## Middleware / contexto tenant
- `core/company_context.py` -> ✅ validación de `X-Company-Id` + membresía activa.
- `config/middleware.py` -> 🟡 solo Request ID (correcto para trazabilidad, no aplica scoping tenant).

---

## Riesgos actuales
1. Endpoints que aún no llamen a `require_company_membership` pueden aceptar contexto cruzado.
2. Endpoints de inventario pendientes de confirmación de filtro por `company_id`.

---

## Próximas acciones (inmediatas)
1. Auditar `core/views.py` (inventory endpoints y company ping).
2. Confirmar que toda query de negocio use `filter(company_id=active_company_id)`.
3. Agregar tests de aislamiento tenant para endpoints críticos de inventario.