"use client"; 

import { Reveal } from "@/components/marketing/Reveal";

export function MissionVisionSection() {
  return (
    <section className="relative isolate overflow-hidden border-y border-slate-200 bg-slate-50/95">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(255,77,99,0.08),transparent_32%)]" />
      <Reveal y={18}>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
          <h2 className="text-2xl font-bold text-slate-900">Nuestra misión</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            Somos una empresa dedicada a crear soluciones logísticas y de empaque
            a la medida de nuestros clientes, mediante un servicio de excelencia y
            seguimiento personalizado.
          </p>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
          <h2 className="text-2xl font-bold text-slate-900">Nuestra visión</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            Con miras al futuro, buscamos expandir operaciones a las principales
            ciudades del país y consolidarnos como una empresa referente en
            soluciones logísticas confiables y cercanas.
          </p>
        </article>
      </div>
      </Reveal>
    </section>
  );
}