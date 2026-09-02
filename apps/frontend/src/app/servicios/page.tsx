"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Boxes,
  Route,
  ShieldCheck,
  BarChart3,
  Clock3,
  Headphones,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Reveal } from "@/components/marketing/Reveal";
import { useTheme } from "next-themes";

const services = [
  {
    icon: Boxes,
    title: "Paquetería nacional e internacional",
    description:
      "Cobertura amplia para envíos en todo México y conexiones internacionales con opciones estándar, exprés y prioritarias.",
    bullets: [
      "Cobertura multi-país con aliados estratégicos",
      "Comparativa de tarifas y tiempos en minutos",
      "Opciones para eCommerce, retail y B2B",
    ],
  },
  {
    icon: Route,
    title: "Ruteo inteligente",
    description:
      "Diseñamos rutas y combinaciones de paquetería para reducir costos logísticos sin comprometer tiempos de entrega.",
    bullets: [
      "Optimización por zona, volumen y urgencia",
      "Selección dinámica de paquetería",
      "Reducción de incidencias por mala asignación",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Envíos más seguros",
    description:
      "Control operativo y trazabilidad por guía para proteger cada envío de origen a destino.",
    bullets: [
      "Trazabilidad end-to-end",
      "Protocolos de empaque y manejo",
      "Soporte ante incidencias y reclamaciones",
    ],
  },
  {
    icon: BarChart3,
    title: "Reporteo y visibilidad",
    description:
      "Convierte la operación logística en indicadores claros para tomar mejores decisiones.",
    bullets: [
      "KPIs de cumplimiento y tiempos",
      "Indicadores por paquetería y ruta",
      "Insights para mejora continua",
    ],
  },
  {
    icon: Clock3,
    title: "Operación ágil",
    description:
      "Aceleramos tus flujos logísticos con procesos definidos para picos de demanda y operación diaria.",
    bullets: [
      "SLAs operativos claros",
      "Escalabilidad en temporadas altas",
      "Estandarización de procesos",
    ],
  },
  {
    icon: Headphones,
    title: "Atención personalizada",
    description:
      "Un equipo experto te acompaña en la ejecución, seguimiento y mejora de tu estrategia logística.",
    bullets: [
      "Atención humana especializada",
      "Seguimiento puntual de casos",
      "Recomendaciones tácticas por operación",
    ],
  },
];

const benefits = [
  "Menor costo logístico por envío",
  "Mayor cumplimiento en tiempos de entrega",
  "Visibilidad total del desempeño operativo",
  "Escalabilidad para crecer sin fricción",
];

export default function ServiciosPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0B1220]">
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.18),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.16),transparent_42%)]" />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80">
              Servicios logísticos
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
              Soluciones para operar mejor,
              <span className="block text-[#C1374A] dark:text-[#FF8FA1]">
                entregar más rápido y crecer con control
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-white/75 md:text-base">
              Centralizamos estrategia, operación y visibilidad para que tu logística sea una ventaja competitiva.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Volver al inicio" className="inline-flex items-center">
              <div
                className={
                  isDark
                    ? "rounded-lg border border-slate-200 bg-white px-2 py-1"
                    : "border-0 bg-transparent p-0 shadow-none"
                }
              >
                <div className="relative h-24 w-[130px]">
                  <Image
                    src="/images/Logo-fb.png"
                    alt="Global Pack Center"
                    fill
                    priority
                    className="object-contain object-left"
                    sizes="130px"
                  />
                </div>
              </div>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              Inicio
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Reveal y={14}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h2 className="text-lg font-bold">¿Qué ganas con Global Pack Center?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b) => (
                <div
                  key={b}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <p className="inline-flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                    <span>{b}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.title} y={16}>
                <article className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#C1374A] dark:border-white/15 dark:bg-white/10 dark:text-[#FF9AAA]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold leading-snug">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/75">
                    {service.description}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {service.bullets.map((bullet) => (
                      <li key={bullet} className="text-sm text-slate-700 dark:text-white/80">
                        • {bullet}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/solicitar-cotizacion"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#C1374A] hover:text-[#9F2436] dark:text-[#FF9AAA] dark:hover:text-[#FFD1D8]"
                  >
                    Solicitar cotización <ChevronRight className="h-4 w-4" />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}