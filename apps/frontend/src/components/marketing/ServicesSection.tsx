"use client";

import Link from "next/link";
import { Boxes, Route, ShieldCheck, BarChart3, Clock3, Headphones, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const services = [
  {
    icon: Boxes,
    title: "Paquetería y carga nacional e internacional",
    description:
      "Cobertura para envíos nacionales e internacionales con opciones estándar y exprés según la urgencia de tu operación.",
  },
  {
    icon: Route,
    title: "Ruteo inteligente y planeación operativa",
    description:
      "Diseñamos la mejor combinación de rutas, tiempos y aliados logísticos para optimizar costo, cumplimiento y capacidad de respuesta.",
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
      "Consolidamos métricas clave de desempeño para tomar decisiones rápidas y mejorar continuamente tu operación.",
  },
  {
    icon: Clock3,
    title: "Operación ágil en picos de demanda",
    description:
      "Aceleramos recolecciones, despachos y tiempos de tránsito con procesos flexibles en temporadas de alta exigencia.",
  },
  {
    icon: Headphones,
    title: "Atención personalizada B2B",
    description:
      "Te acompañamos con soporte cercano para resolver incidencias, coordinar prioridades y ajustar la estrategia cuando lo requieras.",
  },
];

export function ServicesSection() {
  return (
  <section
    id="servicios"
    className="scroll-mt-28 relative isolate overflow-hidden bg-white py-20 text-slate-900 md:py-24"
  >
      {/* Fondo suave consistente con Process */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_12%,rgba(193,55,74,0.08),transparent_34%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <Reveal y={18}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Servicios
            </p>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Soluciones de logística y empaque
              <span className="block text-[var(--primary)]">
                para operar con velocidad, control y rentabilidad
              </span>
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Servicios flexibles para empresas que necesitan eficiencia operativa,
              trazabilidad y cumplimiento en cada envío.
            </p>
          </div>
        </Reveal>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = service.icon;

            return (
              <Reveal key={service.title} delayMs={i * 80} y={18}>
                <article className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/35 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] transition-colors duration-300 group-hover:bg-[var(--primary)]/10">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold leading-snug text-slate-900">{service.title}</h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px]">
                    {service.description}
                  </p>

                  <div className="mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-[var(--primary)] to-transparent opacity-80" />
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* CTA de sección */}
        <Reveal y={14}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center sm:flex-row sm:gap-4 sm:text-left">
            <p className="text-sm text-slate-700 md:text-base">
              ¿Buscas una solución logística ajustada a tu operación y volumen?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Hablar con un especialista
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}