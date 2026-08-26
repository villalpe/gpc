# Auditoría mínima formal (v1)

Objetivo: trazabilidad básica de seguridad y operación.

## Modelo base
Se registra en `AuditEvent` con campos clave:
- `id`
- `created_at`
- `company_id`
- `user_id` (nullable)
- `action`
- `status`
- `message`
- `metadata`

## Eventos mínimos a registrar
1. Autenticación
   - `auth.login.success`
   - `auth.login.failed`
   - `auth.logout`
2. Autorización
   - `authz.denied` (403)
3. Acceso sensible
   - `audit.events.list` (success/denied)
4. Errores relevantes
   - acciones críticas con `status=error`

## Convenciones recomendadas
- `action`: formato `dominio.recurso.accion`
- `status`: `success | denied | error`
- `metadata`: datos técnicos no sensibles (sin secretos)

## Query de verificación (ejemplos)
Últimos eventos por tenant:
```sql
SELECT created_at, action, status, user_id
FROM audit_event
WHERE company_id = '<COMPANY_UUID>'
ORDER BY created_at DESC
LIMIT 100;
```

Eventos denegados recientes:
```sql
SELECT created_at, action, status, message
FROM audit_event
WHERE status = 'denied'
ORDER BY created_at DESC
LIMIT 50;
```

## Criterio de Done
- Documento publicado.
- Eventos mínimos implementados/confirmados.
- Endpoint de lectura auditado y protegido por tenant+rol.