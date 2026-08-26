# Staging Runbook (v1 mínimo)

Objetivo: disponer de un entorno compartible y estable para demo.

## URL de staging
- Base URL: `<PONER_URL_STAGING>`
- Backend health: `<PONER_URL_HEALTH>`
- Frontend: `<PONER_URL_FRONTEND>`

## Estrategia de deploy (mínima)
- Fuente de deploy: branch `master` (o `staging`, definir una).
- Trigger: automático al merge.
- Tiempo esperado de despliegue: `<X min>`.

## Variables/secretos mínimos
- `DJANGO_SETTINGS_MODULE`
- `DATABASE_URL`
- `SECRET_KEY`
- `ALLOWED_HOSTS`
- Variables frontend (`NEXT_PUBLIC_*`) según aplique.

## Smoke test manual (antes de demo)
1. Abrir Home (200)
2. Login válido
3. Navegar a dashboard base
4. Probar endpoint protegido con tenant header
5. Verificar respuesta 401/403 esperada en caso inválido

## Plan B de demo (contingencia)
- Si falla staging:
  - usar build/local previamente validado,
  - video corto de respaldo,
  - dataset demo controlado.

## Criterio de Done
- URL accesible por equipo/cliente.
- Smoke test completo OK.
- Runbook actualizado con enlaces reales.