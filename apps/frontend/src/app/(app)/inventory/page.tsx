"use client";

import { RequirePermission } from "@/components/authz/RequirePermissions";
import { AdjustStockButton } from "./components/AdjustStockButton";
import { Can } from "@/components/authz/Can";

export default function InventoryPage() {
  return (
    <RequirePermission required="inventory.read">
      <main style={{ padding: 24 }}>
        <h1>Contenido de Inventario</h1>
        <Can do="inventory.adjust">
          <AdjustStockButton />
        </Can>
      </main>
    </RequirePermission>
  );
}