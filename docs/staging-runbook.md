# Staging Runbook — GPC Backend (Track B)

## 1) Objetivo
Este runbook define cómo validar que el backend en **staging** está operativo, seguro y compartible para revisión funcional mínima de Track B (tenancy + auth + módulos base).

---

## 2) Entorno de referencia

- **Fecha de validación principal:** 2026-09-12
- **Staging URL:** `https://gpc-rse7.onrender.com`
- **Servicio:** Render Web Service
- **Branch de despliegue:** `master`
- **Estado de deploy esperado:** `Live`

---

## 3) Prerrequisitos

1. Deploy exitoso en Render (`Deploy succeeded | Live`).
2. Variables de entorno configuradas correctamente (especialmente DB y secret).
3. Migraciones aplicadas en staging.
4. Usuario administrador disponible para pruebas JWT.
5. Al menos una company y una membership activa para el admin.

---

## 4) Variables de entorno mínimas (staging)

> Nota: este bloque es guía operativa; los valores reales viven en Render.

- `DJANGO_SECRET_KEY=<secret>`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=gpc-rse7.onrender.com`
- `DATABASE_URL=postgresql://...`  ← **obligatoria en Render**
- `CORS_ALLOWED_ORIGINS=<frontend-staging(s)>`
- `CSRF_TRUSTED_ORIGINS=<frontend-staging(s)>`

### Decisión técnica importante
En staging, Django debe priorizar `DATABASE_URL`.  
Si `DATABASE_URL` falta o no se parsea, la app puede intentar `127.0.0.1:5432` y fallar con `OperationalError`.

---

## 5) Comandos operativos útiles

### 5.1 Validación local previa a push
```bash
cd apps/backend
ruff check .
pytest -q
```

### 5.2 Operación en Render Shell
```bash
cd apps/backend
python manage.py migrate
python manage.py createsuperuser
```

### 5.3 Generar token en staging
```http
POST /api/token/
Content-Type: application/json

{
  "email": "admin@gpc.local",
  "password": "********"
}
```

---

## 6) Smoke tests obligatorios (staging)

## Convenciones
- **Auth header:** `Authorization: Bearer <access_token_staging>`
- **Tenant header:** `X-Company-Id: <uuid>`
- **Tenant válido usado en evidencia:** `4b0cc453-86a0-47b3-95c4-7a1c58ebed3f`

### Matriz de resultados (evidencia real)

| Endpoint | Método | Auth | X-Company-Id | Body | Status | Response (resumen) |
|---|---|---|---|---|---|---|
| `/api/company/ping/` | GET | Sí | Sí | No | 200 OK | `{ "ok": true, "company_id": "4b0cc453-86a0-47b3-95c4-7a1c58ebed3f" }` |
| `/api/company/ping/` | GET | Sí | No | No | 400 Bad Request | `[ "Missing X-Company-Id header" ]` |
| `/api/company/ping/` | GET | No | Sí | No | 401 Unauthorized | `{ "detail": "Las credenciales de autenticación no se proveyeron." }` |
| `/api/company/ping/` | GET | No | No | No | 401 Unauthorized | `{ "detail": "Las credenciales de autenticación no se proveyeron." }` |
| `/api/modules/inventory/ping/` | GET | Sí | Sí | No | 200 OK | `{ "ok": true, "module": "inventory" }` |
| `/api/modules/audit/ping/` | GET | Sí | Sí | No | 200 OK | `{ "ok": true, "module": "audit" }` |
| `/api/modules/inventory/adjust/` | POST | Sí | Sí | Sí | 200 OK | `{ "ok": true, "sku": "SKU-001", "delta": 5 }` |
| `/api/me/roles/` | GET | Sí | No | No | 200 OK | incluye rol `ADMIN_COMPANY` en `gpc-demo` |
| `/api/me/permissions/` | GET | Sí | No | No | 200 OK | incluye `audit.read`, `inventory.adjust`, `inventory.read`, `inventory.write`, `users.invite` |

---

## 7) Criterios de aceptación (Go/No-Go)

### GO (apto para compartir staging)
- `/api/health/` responde 200.
- JWT funciona en staging (`/api/token/` responde 200 con credenciales válidas).
- Tenant guard responde 4xx controlado para errores de cliente y 200 para caso válido.
- Endpoints base de módulos (`inventory`, `audit`) operativos con auth.
- `ruff` y `pytest` en verde en `master`.

### NO-GO
- Cualquier 500 en flujo auth/tenant.
- Falla de conexión a DB por configuración (`127.0.0.1:5432` en Render).
- Respuestas inconsistentes que rompan contrato de auth/tenant.

---

## 8) Troubleshooting

### 8.1 `token_not_valid`
**Síntoma**  
`"Given token not valid for any token type"`.

**Causa probable**
- Token expirado.
- Token emitido en otro entorno (local vs staging).

**Acción**
1. Generar nuevo token en `https://gpc-rse7.onrender.com/api/token/`.
2. Repetir request con ese access token.

---

### 8.2 `OperationalError` a `127.0.0.1:5432` en Render
**Síntoma**
- `connection refused` al correr `migrate`, `createsuperuser` o al autenticar.

**Causa raíz**
- `settings.py` no está tomando `DATABASE_URL` o está siendo sobreescrito.

**Acción**
1. Verificar `DATABASE_URL` en Render (servicio correcto).
2. Confirmar parse de `DATABASE_URL` en `settings.py`.
3. Redeploy manual.
4. Reintentar `migrate` y `createsuperuser`.

---

### 8.3 `roles: []` en `/api/me/roles/`
**Síntoma**
- Auth 200 pero sin roles.

**Causa**
- Usuario existe, pero no tiene membership activa en staging DB.

**Acción**
- Crear `Company` + `Membership` activa para el usuario admin.

---

## 9) Contingencia (Plan B)

Si staging principal falla temporalmente:
1. Revertir al último deploy `Live` estable.
2. Validar health + token + `company/ping`.
3. Compartir temporalmente evidencia desde entorno local controlado (solo interno) mientras se restablece staging.
4. Reabrir staging público solo tras pasar smoke tests obligatorios.

---

## 10) Registro de ejecución (plantilla)

```md
Fecha/Hora:
Responsable:
Commit SHA:
Render Deploy ID/URL:
Resultado smoke:
- health:
- token:
- company ping A/B/C/D:
- inventory ping:
- audit ping:
- inventory adjust:
Observaciones:
Acción de seguimiento:
```

---

## 11) Estado actual

**Staging funcional y compartible** para validación de Track B, con tenancy/auth operando y evidencia documentada.