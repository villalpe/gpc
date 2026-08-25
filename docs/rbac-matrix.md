# RBAC Matrix (Step 10)

## Roles
- SuperAdmin
- AdminEmpresa
- Operador
- Viewer

## Permisos y capacidades esperadas

| Rol         | audit.read | inventory.read | inventory.write | inventory.adjust | users.invite | Acceso /users | Ajustar inventario |
|-------------|------------|----------------|-----------------|------------------|--------------|---------------|--------------------|
| SuperAdmin  | ✅         | ✅             | ✅              | ✅               | ✅           | ✅            | ✅                 |
| AdminEmpresa| ✅         | ✅             | ✅              | ✅               | ✅           | ✅            | ✅                 |
| Operador    | ✅         | ✅             | ✅              | ❌               | ❌           | ❌            | ❌                 |
| Viewer      | ✅         | ✅             | ❌              | ❌               | ❌           | ❌            | ❌                 |

## Validaciones mínimas (QA)
1. Admin puede ajustar inventario.
2. Viewer no ve botón ajustar.
3. Viewer no puede entrar a /users.
4. Viewer no puede ejecutar adjust (403).
5. /api/me y /api/me/permissions responden según sesión/contexto.