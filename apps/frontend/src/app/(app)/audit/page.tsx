"use client";

import { RequirePermission } from "@/components/authz/RequirePermissions";

export default function AuditPage() {
  return (
    <RequirePermission required="audit.read">
      <div>
        <h1>Auditoría</h1>
        <p>Listado de eventos de auditoría.</p>
      </div>
    </RequirePermission>
  );
}