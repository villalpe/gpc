"use client";

import { ClipboardList, SearchCheck, Truck, BarChart3 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  {
    icon: ClipboardList,
    title: "1. Diagnóstico logístico de paquetería y carga",
    description:
      "Evaluamos tipo de carga, volumen, frecuencia, ventanas de entrega y zonas de cobertura para diseñar una operación viable y escalable.",
  },
  {
    icon: SearchCheck,
    title: "2. Diseño de estrategia y red",
    description:
      "Definimos la mejor combinación de rutas, unidades, aliados de transporte y niveles de servicio para optimizar costo, tiempo y confiabilidad.",
  },
  {
    icon: Truck,
    title: "3. Implementación operativa",
    description:
      "Activamos la operación con coordinación punta a punta, control de embarques, trazabilidad y comunicación continua con tu equipo.",
  },
  {
    icon: BarChart3,
    title: "4. Control y mejora continua",
    description:
      "Monitoreamos KPIs logísticos (OTD, incidencias, costo por envío y tiempos de tránsito) para corregir desvíos y mejorar resultados de forma sostenida.",
  },
];

const kpis = [
  { label: "Entregas a tiempo (OTD)", value: "98%" },
  { label: "Trazabilidad operativa", value: "24/7" },
  { label: "Reducción de incidencias", value: "-30%" },
  { label: "Optimización de costo", value: "↓ Costo/envío" },
];

export function ProcessSteps() {
  return (
    <section className="relative isolate overflow-hidden border-y border-slate-200/80 bg-slate-50 py-20 text-slate-900 md:py-24">
      {/* Fondo uniforme en toda la sección */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_12%,rgba(193,55,74,0.10),transparent_38%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal y={16}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cómo operamos tu paquetería y carga
            </p>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Un proceso logístico
              <span className="block text-[var(--primary)]">
                claro, medible y orientado a resultados
              </span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Desde el diagnóstico hasta la optimización continua, estructuramos cada etapa para
              que tu operación gane control, puntualidad y rentabilidad.
            </p>
          </div>
        </Reveal>

        <Reveal y={14}>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-lg font-extrabold text-[var(--primary)] md:text-xl">{kpi.value}</p>
                <p className="mt-1 text-xs leading-snug text-slate-600 md:text-sm">{kpi.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <Reveal key={step.title} delayMs={i * 90} y={18}>
                <article className="group relative h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-lg md:p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] transition-colors duration-300 group-hover:bg-[var(--primary)]/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-base font-bold leading-snug text-slate-900 md:text-lg">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px]">
                    {step.description}
                  </p>

                  <div className="mt-5 h-[2px] w-14 rounded-full bg-gradient-to-r from-[var(--primary)] to-transparent opacity-80" />
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}