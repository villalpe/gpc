"use client";

import { Reveal } from "@/components/marketing/Reveal";
import { Compass, Eye } from "lucide-react";

export function MissionVisionSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-slate-200 bg-slate-50 py-20 text-slate-900 md:py-24">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(193,55,74,0.08),transparent_34%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal y={16}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Identidad GPC
            </p>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Misión y visión
              <span className="block text-[var(--primary)]">que guían nuestra operación</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Nuestro enfoque estratégico para operar con excelencia hoy y crecer de forma sostenible mañana.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal y={14}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-md md:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-rose-400 to-transparent" />
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)]">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Nuestra misión</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                Somos una empresa dedicada a crear soluciones logísticas y de empaque
                a la medida de nuestros clientes, mediante un servicio de excelencia y
                seguimiento personalizado.
              </p>
            </article>
          </Reveal>

          <Reveal y={14} delayMs={100}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-md md:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary)] via-rose-400 to-transparent" />
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)]">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Nuestra visión</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                Con miras al futuro, buscamos expandir operaciones a las principales
                ciudades del país y consolidarnos como una empresa referente en
                soluciones logísticas confiables y cercanas.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}