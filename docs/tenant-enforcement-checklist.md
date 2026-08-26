# Tenant Enforcement Checklist (v1 mínimo)

Objetivo: asegurar aislamiento multiempresa en endpoints críticos.

## Regla obligatoria
- Todo endpoint sensible debe:
  1) exigir `X-Company-Id` válido, y
  2) filtrar datos por `company_id` en consultas.

## Endpoints críticos (inicial)
- [ ] `GET /api/audit/events/`
- [ ] `...` (inventario)
- [ ] `...` (módulos sensibles adicionales)

> Completar esta lista con los endpoints reales del backend.

## Checklist por endpoint
Para cada endpoint crítico, validar:

- [ ] Usa helper central (`require_company_membership` o equivalente).
- [ ] Rechaza request sin `X-Company-Id` con `400`.
- [ ] Rechaza membresía/rol inválido con `403`.
- [ ] Query principal aplica `company_id=<tenant activo>`.
- [ ] No existen queries alternas sin filtro tenant.
- [ ] Tiene test de aislamiento A/B (tenant A no ve tenant B).

## Evidencia técnica (rellenar)
- Endpoint:
- Archivo:
- Método:
- Filtro tenant aplicado:
- Test asociado:
- Resultado:

## Criterio de Done
- 100% de endpoints críticos marcados.
- Tests de aislamiento en verde.
- `ruff check .` y `pytest -q` en verde.