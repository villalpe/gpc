"use client";

import { CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const benefits = [
  "Ahorro logístico estimado de 10% a 25% por optimización de rutas y servicios",
  "Hasta 98% de visibilidad operativa en eventos clave del envío",
  "Escalabilidad para crecimiento multi-sucursal y picos de demanda",
  "Soporte especializado para operación crítica y gestión de incidencias",
  "Decisiones más rápidas con tableros y métricas accionables",
  "Mejor experiencia de entrega para tu cliente final",
];

export function BenefitsGrid() {
  return (
    <section className="relative isolate overflow-hidden border-t border-slate-200 bg-slate-50 py-20 text-slate-900 md:py-24">
      {/* Fondo suave consistente */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_14%,rgba(193,55,74,0.08),transparent_36%)]" />

      <Reveal y={16}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Beneficios
            </p>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Beneficios clave
              <span className="block text-[var(--primary)]">para tu operación logística</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Impactos orientativos basados en mejoras operativas de logística y distribución.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item, i) => (
              <Reveal key={item} delayMs={i * 70} y={14}>
                <article className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-md">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">{item}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-500 md:text-sm">
            *Los resultados pueden variar según tipo de carga, volumen, cobertura y condiciones de operación.
          </p>
        </div>
      </Reveal>
    </section>
  );
}