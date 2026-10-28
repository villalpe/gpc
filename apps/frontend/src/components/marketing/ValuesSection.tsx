"use client";

import { Reveal } from "@/components/marketing/Reveal";
import { ShieldCheck, Handshake, ClipboardCheck, HeartHandshake } from "lucide-react";

const values = [
  {
    title: "Confiabilidad",
    desc: "Estandarización de productos, servicios, imagen y atención en todas las sucursales.",
    icon: ShieldCheck,
  },
  {
    title: "Servicio",
    desc: "Eficiencia y amabilidad en la atención a cada cliente.",
    icon: Handshake,
  },
  {
    title: "Disciplina",
    desc: "Apego a las normas y procesos de la empresa.",
    icon: ClipboardCheck,
  },
  {
    title: "Pasión",
    desc: "Compromiso genuino por lo que hacemos, reflejado en cada envío.",
    icon: HeartHandshake,
  },
];

export function ValuesSection() {
  return (
    <section className="relative isolate overflow-hidden border-t border-slate-200 bg-white py-20 text-slate-900 md:py-24">
      {/* Fondo suave consistente */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_84%_16%,rgba(193,55,74,0.08),transparent_34%)]" />

      <Reveal y={16}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Valores
            </p>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Nuestros valores
              <span className="block text-[var(--primary)]">la base de cada operación</span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Principios que guían nuestro servicio y la forma en que operamos cada envío.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <Reveal key={value.title} delayMs={i * 80} y={14}>
                  <article className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-md">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] transition-colors duration-300 group-hover:bg-[var(--primary)]/10">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.desc}</p>

                    <div className="mt-4 h-[2px] w-14 rounded-full bg-gradient-to-r from-[var(--primary)] to-transparent opacity-80" />
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}