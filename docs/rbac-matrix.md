# RBAC Matrix (Step 10)

## Roles
- SuperAdmin
- AdminEmpresa
- Operador
- Viewer
- Cliente (CLIENT)

## Permisos y capacidades esperadas

| Rol         | audit.read | inventory.read | inventory.write | inventory.adjust | users.invite | Acceso /users | Ajustar inventario |
|-------------|------------|----------------|-----------------|------------------|--------------|---------------|--------------------|
| SuperAdmin  | ✅         | ✅             | ✅              | ✅               | ✅           | ✅            | ✅                 |
| AdminEmpresa| ✅         | ✅             | ✅              | ✅               | ✅           | ✅            | ✅                 |
| Operador    | ✅         | ✅             | ✅              | ❌               | ❌           | ❌            | ❌                 |
| Viewer      | ✅         | ✅             | ❌              | ❌               | ❌           | ❌            | ❌                 |

## Módulo `quotes` (cotizador Skydropx nacional)

Todos los roles (SuperAdmin, AdminEmpresa, Operador, Viewer, Cliente) pueden crear y leer
cotizaciones (`CanAccessQuotes`). El precio solo lo ven los roles con `quotes.view_price`;
para los demás el backend **elimina** `price`, `price_breakdown` y montos de la respuesta.

| Rol         | quotes.read | quotes.create | quotes.view_price |
|-------------|-------------|---------------|-------------------|
| SuperAdmin  | ✅          | ✅            | ✅                |
| AdminEmpresa| ✅          | ✅            | ✅                |
| Operador    | ✅          | ✅            | ✅                |
| Viewer      | ✅          | ✅            | ❌                |
| Cliente     | ✅          | ✅            | ❌                |

Sin membresía o rol desconocido: acceso denegado / sin precio. Las consultas se filtran por
la compañía activa (`X-Company-Id`).

## Validaciones mínimas (QA)
1. Admin puede ajustar inventario.
2. Viewer no ve botón ajustar.
3. Viewer no puede entrar a /users.
4. Viewer no puede ejecutar adjust (403).
5. /api/me y /api/me/permissions responden según sesión/contexto.