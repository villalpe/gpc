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
    <section className="relative isolate overflow-hidden py-20 text-white md:py-24">
      {/* Fondo alternativo (plum/índigo corporativo) */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#151A33_0%,#211734_52%,#120E22_100%)]" />

      {/* Glow cálido suave (arriba izquierda) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(255,106,130,0.20),transparent_34%)]" />

      {/* Glow frío principal (derecha inferior) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_84%_82%,rgba(124,143,184,0.24),transparent_40%)]" />

      {/* Viñeta para legibilidad */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.42)_100%)]" />

      {/* Línea superior sutil */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <Reveal y={18}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold md:text-3xl">
            Nuestros valores
            <span className="mt-1 block text-[#E88AA0]">la base de cada operación</span>
          </h2>

          <p className="mt-2 text-white/72">
            Principios que guían nuestro servicio en cada operación.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border border-white/20 bg-white/8 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E88AA0]/55 hover:bg-white/12 hover:shadow-[0_10px_28px_rgba(8,12,28,0.45)]"
              >
                <h3 className="text-base font-semibold text-white">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/78">{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}