"use client";

import { CursorGlow } from "@/components/marketing/CursorGlow";
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
    <section className="relative isolate overflow-hidden text-white">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#0a0f1d_0%,#11162a_55%,#161126_100%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[420px] w-[900px] -translate-x-1/2 rotate-[-8deg] bg-[radial-gradient(ellipse_at_center,rgba(124,143,184,0.30)_0%,rgba(124,143,184,0.10)_35%,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] -z-10 h-80 w-80 rounded-full bg-[#8b2c3e]/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      {/* Glow dinámico */}
      <CursorGlow color="255,90,107" size={320} strength={0.16} />
      <CursorGlow color="124,143,184" size={260} strength={0.12} className="mix-blend-screen" />

      <Reveal y={18}>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <h2 className="text-2xl font-bold md:text-3xl">
            Beneficios clave
            <span className="mt-1 block text-brand-red">para tu operación logística</span>
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70 md:text-base">
            Impactos orientativos basados en mejoras operativas de logística y distribución.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/20 bg-gradient-to-b from-white/14 to-white/6 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/55 hover:from-white/20 hover:to-white/10 hover:shadow-[0_10px_28px_rgba(11,19,36,0.45)]"
              >
                <p className="text-sm font-medium leading-relaxed text-white/95">{item}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-white/55 md:text-sm">
            *Los resultados pueden variar según tipo de carga, volumen, cobertura y condiciones de operación.
          </p>
        </div>
      </Reveal>
    </section>
  );
}