# Contributing Guide (v1)

Gracias por contribuir.

## Flujo obligatorio
1. Crear branch de trabajo desde `master`.
2. Abrir Pull Request (PR) hacia `master`.
3. Esperar checks obligatorios en verde.
4. Hacer merge usando **Squash and merge**.

## Reglas de calidad (requeridas)
- Lint: `ruff check .`
- Tests: `pytest -q`
- Build: (si aplica en pipeline frontend/backend)

> Ningún PR se mergea con checks fallando.

## Convención de commits (recomendada)
- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `chore(scope): ...`

## Multi-tenant (obligatorio)
En endpoints sensibles:
- exigir `X-Company-Id`,
- validar membresía/permiso,
- filtrar por `company_id`.

## Definición de Done
- Código + tests + docs actualizados.
- PR con descripción clara.
- Checks CI en verde.