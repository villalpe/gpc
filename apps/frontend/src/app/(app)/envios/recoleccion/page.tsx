"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, Truck } from "lucide-react";

type Shipment = {
  id: number;
  status: string;
  carrier: string;
  service: string;
  origin: { city?: string; state?: string; postal_code?: string };
  destination: { city?: string; state?: string; contact_name?: string };
  parcels: unknown[];
  created_at: string;
  picked_up?: boolean; // provisional: confirmar con backend
};

function place(a: { city?: string; state?: string }) {
  return [a.city, a.state].filter(Boolean).join(", ") || "-";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function RecoleccionPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [filter, setFilter] = useState<"" | "picked" | "not_picked">("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [scheduling, setScheduling] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quotes/shipments", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.detail || json?.message || "No se pudieron cargar los envíos.");
      setShipments(json?.data ?? []);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los envíos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(
    () =>
      shipments.filter((s) => {
        if (filter === "picked") return !!s.picked_up;
        if (filter === "not_picked") return !s.picked_up;
        return true;
      }),
    [shipments, filter]
  );

  // Solo se pueden seleccionar guías generadas y aún no recolectadas
  const canSelect = (s: Shipment) => s.status === "booked" && !s.picked_up;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSchedule() {
    if (selected.size === 0) return;
    setScheduling(true);
    setError("");
    setInfo("");
    try {
      // Endpoint por definir en backend
      const res = await fetch("/api/quotes/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment_ids: Array.from(selected) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.detail || json?.message || "No se pudo programar la recolección.");
      setInfo("Recolección programada correctamente.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo programar la recolección.");
    } finally {
      setScheduling(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-[#030712] dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-[#C1374A]" />
            <div>
              <h1 className="text-2xl font-extrabold">Recolecciones</h1>
              <p className="text-sm text-slate-600 dark:text-white/70">
                {visible.length} {visible.length === 1 ? "envío" : "envíos"} · {selected.size} seleccionado(s)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "" | "picked" | "not_picked")}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="picked">Recolectados</option>
              <option value="not_picked">No recolectados</option>
            </select>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => void onSchedule()}
              disabled={selected.size === 0 || scheduling}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              {scheduling ? "Programando..." : "Programar Recolección"}
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {info && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            {info}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-md dark:border-white/15 dark:bg-white/[0.06]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              <tr>
                <th className="px-3 py-3">Envío</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Paquetería</th>
                <th className="px-3 py-3">Origen</th>
                <th className="px-3 py-3">Destino</th>
                <th className="px-3 py-3">Paquetes</th>
                <th className="px-3 py-3">Recolección</th>
                <th className="px-3 py-3 text-center">Seleccionar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading && shipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500 dark:text-white/60">
                    Cargando envíos...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500 dark:text-white/60">
                    No hay envíos para mostrar.
                  </td>
                </tr>
              )}

              {visible.map((s) => {
                const isSel = selected.has(s.id);
                const selectable = canSelect(s);
                return (
                  <tr key={s.id} className={isSel ? "bg-rose-50/60 dark:bg-white/[0.06]" : ""}>
                    <td className="px-3 py-3 font-semibold">#{s.id}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(s.created_at)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{s.carrier || "-"}</p>
                      <p className="text-xs text-slate-500 dark:text-white/60">{s.service}</p>
                    </td>
                    <td className="px-3 py-3">
                      {place(s.origin)}
                      <p className="text-xs text-slate-500 dark:text-white/60">C.P. {s.origin.postal_code}</p>
                    </td>
                    <td className="px-3 py-3">
                      {place(s.destination)}
                      <p className="text-xs text-slate-500 dark:text-white/60">{s.destination.contact_name}</p>
                    </td>
                    <td className="px-3 py-3">{s.parcels.length}</td>
                    <td className="px-3 py-3">
                      {s.picked_up ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                          Recolectado
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-200">
                          No Recolectado
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        disabled={!selectable}
                        title={selectable ? "" : "Requiere guía generada y no recolectado"}
                        className={`h-8 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isSel
                            ? "bg-[#C1374A] text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
                        }`}
                      >
                        {isSel ? "Seleccionado" : "Seleccionar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}