"use client";

import { apiFetch } from "@/lib/apiFetch";
import { toast } from "sonner";

export function AdjustStockButton() {
  async function onAdjust() {
    try {
      await apiFetch("/api/modules/inventory/adjust/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: "ABC", delta: 5 }),
      });

      toast.success("Inventario ajustado");
    } catch (e: any) {
      if (e?.message === "FORBIDDEN") {
        toast.error("No autorizado");
        return;
      }
      toast.error("No se pudo ajustar inventario");
    }
  }

  return <button onClick={onAdjust}>Ajustar</button>;
}