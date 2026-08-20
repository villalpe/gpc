"use client";

import { RequirePermission } from "@/components/authz/RequirePermissions";

export default function UsersPage() {
  return (
    <RequirePermission required="users.invite">
      <main style={{ padding: 24 }}>
        <h1>Usuarios</h1>
        <p>Contenido de usuarios (invitar / deshabilitar).</p>
      </main>
    </RequirePermission>
  );
}