"use client";

import { Reveal } from "@/components/marketing/Reveal";

const values = [
  {
    title: "Confiabilidad",
    desc: "Estandarización de productos, servicios, imagen y atención en todas las sucursales.",
  },
  {
    title: "Servicio",
    desc: "Eficiencia y amabilidad en la atención a cada cliente.",
  },
  {
    title: "Disciplina",
    desc: "Apego a las normas y procesos de la empresa.",
  },
  {
    title: "Pasión",
    desc: "Amor por lo que hacemos, reflejado en cada envío.",
  },
];

export function ValuesSection() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-2 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_20%,rgba(255,77,99,0.10),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(2,6,23,0.36)_100%)]" />

      <Reveal y={18}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold md:text-3xl">Nuestros valores</h2>
        <p className="mt-2 text-white/70">
          Principios que guían nuestro servicio en cada operación.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <article
              key={value.title}
              className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-red/40 hover:bg-white/10"
            >
              <h3 className="text-base font-semibold text-white">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{value.desc}</p>
            </article>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}