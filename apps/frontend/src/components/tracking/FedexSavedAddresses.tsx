"use client";

import { useEffect, useState } from "react";
import type { FedexParty } from "@/lib/cargobase/fedex";
import { rateValidationErrors } from "@/lib/cargobase/fedex-rate-errors";

type Address = { id: number; label: string; party: FedexParty };

export default function FedexSavedAddresses({
  party, onSelect,
}: {
  party: FedexParty;
  onSelect: (party: FedexParty) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/fedex/addresses");
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "No se pudieron cargar las direcciones.");
        if (!Array.isArray(data.addresses)) throw new Error("Respuesta de direcciones inválida.");
        if (active) setAddresses(data.addresses);
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "No se pudieron cargar las direcciones.");
      }
    }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("fedex-addresses-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("fedex-addresses-updated", refresh);
    };
  }, []);

  async function save() {
    if (!label.trim()) {
      setMessage("Escribe un nombre para identificar la dirección.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/fedex/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), party }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(rateValidationErrors(data).join(" ") || "No se pudo guardar la dirección.");
      setAddresses((current) => [data, ...current]);
      window.dispatchEvent(new Event("fedex-addresses-updated"));
      setLabel("");
      setMessage("Dirección guardada para la empresa.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la dirección.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-white/10">
      <label className="block text-sm">
        Usar dirección guardada
        <select defaultValue="" onChange={(event) => {
          const found = addresses.find((address) => String(address.id) === event.target.value);
          if (found) onSelect(found.party);
          event.target.value = "";
        }} className="ml-2 rounded-lg border border-slate-300 bg-white p-2 text-slate-900">
          <option value="">Selecciona...</option>
          {addresses.map((address) => <option key={address.id} value={address.id}>{address.label}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <label className="text-sm">Nombre para guardar
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120}
            className="ml-2 rounded-lg border border-slate-300 bg-white p-2 text-slate-900" />
        </label>
        <button type="button" onClick={save} disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">
          {busy ? "Guardando..." : "Guardar dirección"}
        </button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}
