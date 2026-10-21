"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronRight, PackageSearch, RefreshCw } from "lucide-react";

type ShipmentAddress = {
  city?: string;
  state?: string;
  postal_code?: string;
  area?: string;
  street?: string;
  exterior_number?: string;
  contact_name?: string;
  contact_phone?: string;
  company_name?: string;
};

type ShipmentParcel = {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: string | number;
  declared_value: string | number;
  package_protected: boolean;
  contents_description: string;
  consignment_note: string;
  packaging_type: string;
};

type Shipment = {
  id: number;
  status: "pending" | "booked" | "canceled" | string;
  carrier: string;
  service: string;
  estimated_days: number | null;
  origin: ShipmentAddress;
  destination: ShipmentAddress;
  weight_summary: { chargeable_kg?: number; real_kg?: number; volumetric_kg?: number };
  parcels: ShipmentParcel[];
  rate: { price?: string };
  notes: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: {
    text: "Pendiente",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  },
  booked: {
    text: "Guía generada",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  },
  canceled: {
    text: "Cancelado",
    cls: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
  },
};

function place(a: ShipmentAddress) {
  return [a.city, a.state].filter(Boolean).join(", ") || "-";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function formatPrice(s: Shipment) {
  const n = Number(s.rate?.price);
  return s.rate?.price && !Number.isNaN(n) ? `$${n.toFixed(2)} MXN` : "-";
}

export default function MisEnviosPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/quotes/shipments${qs}`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: Shipment[]; detail?: string; message?: string }
        | null;
      if (!res.ok) throw new Error(json?.detail || json?.message || "No se pudieron cargar los envíos.");
      setShipments(json?.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los envíos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-[#030712] dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PackageSearch className="h-6 w-6 text-[#C1374A]" />
            <div>
              <h1 className="text-2xl font-extrabold">Mis envíos</h1>
              <p className="text-sm text-slate-600 dark:text-white/70">
                {shipments.length} {shipments.length === 1 ? "envío" : "envíos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Todos los estatus</option>
              <option value="pending">Pendiente</option>
              <option value="booked">Guía generada</option>
              <option value="canceled">Cancelado</option>
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
            <Link
              href="/solicitar-cotizacion"
              className="inline-flex h-10 items-center rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white hover:bg-[#9F2436]"
            >
              Nuevo envío
            </Link>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-md dark:border-white/15 dark:bg-white/[0.06]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3">Envío</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Paquetería</th>
                <th className="px-3 py-3">Origen</th>
                <th className="px-3 py-3">Destino</th>
                <th className="px-3 py-3">Paquetes</th>
                <th className="px-3 py-3">Peso cobrable</th>
                <th className="px-3 py-3">Precio</th>
                <th className="px-3 py-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading && shipments.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 dark:text-white/60">
                    Cargando envíos...
                  </td>
                </tr>
              )}

              {!loading && shipments.length === 0 && !error && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500 dark:text-white/60">
                    Aún no hay envíos.
                  </td>
                </tr>
              )}

              {shipments.map((s) => {
                const open = openId === s.id;
                const st = STATUS_LABEL[s.status] ?? { text: s.status, cls: "bg-slate-100 text-slate-700" };
                return (
                  <Fragment key={s.id}>
                    <tr
                      onClick={() => setOpenId(open ? null : s.id)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                    >
                      <td className="px-3 py-3 text-slate-400">
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-3 py-3 font-semibold">#{s.id}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(s.created_at)}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{s.carrier || "-"}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {s.service}
                          {s.estimated_days ? ` · ${s.estimated_days} día(s)` : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {place(s.origin)}
                        <p className="text-xs text-slate-500 dark:text-white/60">C.P. {s.origin.postal_code}</p>
                      </td>
                      <td className="px-3 py-3">
                        {place(s.destination)}
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {s.destination.contact_name}
                        </p>
                      </td>
                      <td className="px-3 py-3">{s.parcels.length}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.weight_summary?.chargeable_kg != null
                          ? `${Number(s.weight_summary.chargeable_kg).toFixed(2)} kg`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-[#C1374A]">
                        {formatPrice(s)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                          {st.text}
                        </span>
                      </td>
                    </tr>

                    {open && (
                      <tr className="bg-slate-50/70 dark:bg-white/[0.03]">
                        <td />
                        <td colSpan={9} className="space-y-3 px-3 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            {(["origin", "destination"] as const).map((k) => {
                              const a = s[k];
                              return (
                                <div key={k} className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-white/15 dark:bg-white/[0.06]">
                                  <p className="mb-1 font-bold uppercase text-slate-500 dark:text-white/60">
                                    {k === "origin" ? "Origen" : "Destino"}
                                  </p>
                                  <p>
                                    {a.street} {a.exterior_number}, {a.area}
                                  </p>
                                  <p>
                                    {a.city}, {a.state} · C.P. {a.postal_code}
                                  </p>
                                  <p>
                                    {a.contact_name} · {a.contact_phone}
                                  </p>
                                  {a.company_name && <p>{a.company_name}</p>}
                                </div>
                              );
                            })}
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-white/15 dark:bg-white/[0.06]">
                            <p className="mb-2 font-bold uppercase text-slate-500 dark:text-white/60">
                              Paquetes y contenido
                            </p>
                            <ul className="divide-y divide-slate-100 dark:divide-white/10">
                              {s.parcels.map((p, i) => (
                                <li key={i} className="flex flex-wrap justify-between gap-2 py-1.5">
                                  <span>
                                    <strong>{i + 1}.</strong> {p.contents_description}
                                    {p.consignment_note ? ` · Carta Porte ${p.consignment_note}` : ""}
                                  </span>
                                  <span className="text-slate-600 dark:text-white/70">
                                    {p.length_cm}×{p.width_cm}×{p.height_cm} cm · {Number(p.weight_kg)} kg
                                    {Number(p.declared_value) > 0 ? ` · Valor $${Number(p.declared_value)}` : ""}
                                    {p.package_protected ? " · Con seguro" : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {s.notes && <p className="text-xs">Notas: {s.notes}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}