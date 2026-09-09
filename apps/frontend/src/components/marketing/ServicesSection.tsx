"use client";

import { Boxes, Route, ShieldCheck, BarChart3, Clock3, Headphones } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const services = [
  {
    icon: Boxes,
    title: "Paquetería y carga nacional e internacional",
    description:
      "Cobertura para envíos nacionales e internacionales, con opciones estándar y exprés según la urgencia de tu operación.",
  },
  {
    icon: Route,
    title: "Ruteo inteligente y planeación operativa",
    description:
      "Definimos la mejor combinación de rutas, tiempos y aliados logísticos para optimizar costo, cumplimiento y capacidad de respuesta.",
  },
  {
    icon: ShieldCheck,
    title: "Envíos más seguros y trazables",
    description:
      "Aplicamos protocolos operativos y seguimiento por guía para reducir incidencias y mantener visibilidad de punta a punta.",
  },
  {
    icon: BarChart3,
    title: "Reporteo logístico y visibilidad",
    description:
      "Consolidamos métricas clave de desempeño para tomar decisiones rápidas y mejorar continuamente tu operación de carga.",
  },
  {
    icon: Clock3,
    title: "Operación ágil en picos de demanda",
    description:
      "Aceleramos recolecciones, despachos y tiempos de tránsito con procesos flexibles para temporadas de alta exigencia.",
  },
  {
    icon: Headphones,
    title: "Atención personalizada B2B",
    description:
      "Te acompañamos con soporte cercano para resolver incidencias, coordinar prioridades y ajustar la estrategia cuando tu operación lo requiera.",
  },
];

export function ServicesSection() {
  return (
    <section id="servicios" className="scroll-mt-28 relative isolate overflow-hidden py-20 text-white md:py-24">
      {/* Fondo acento (vino/magenta oscuro) */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#2A0F1D_0%,#341225_48%,#1A0B14_100%)]" />

      {/* Glow superior derecho */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(255,77,99,0.30),transparent_34%)]" />

      {/* Glow inferior izquierdo frío para balance */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_88%,rgba(124,143,184,0.18),transparent_38%)]" />

      {/* Viñeta suave para contraste de texto */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.20)_0%,rgba(2,6,23,0.36)_100%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <Reveal y={18}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
              Servicios
            </p>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
              Soluciones de carga y logística B2B
              <span className="block text-[#F05A72] [text-shadow:0_2px_14px_rgba(255,77,99,0.28)]">
                para operar con velocidad, control y rentabilidad
              </span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">
              Diseñamos servicios flexibles para empresas que necesitan eficiencia operativa,
              trazabilidad y cumplimiento en cada envío.
            </p>
          </div>
        </Reveal>

        {/* Grid con animación escalonada */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = service.icon;

            return (
              <Reveal key={service.title} delayMs={i * 90} y={20}>
                <article className="group h-full rounded-2xl border border-white/20 bg-white/8 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F05A72]/55 hover:bg-white/12 hover:shadow-[0_12px_35px_rgba(255,77,99,0.16)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-black/20 text-brand-redSoft transition-colors duration-300 group-hover:bg-black/30">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold leading-snug text-white">{service.title}</h3>

                  <p className="mt-3 text-sm leading-relaxed text-white/80 md:text-[15px]">
                    {service.description}
                  </p>

                  <div className="mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-[#F05A72] to-transparent opacity-90" />
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}