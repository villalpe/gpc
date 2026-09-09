"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Globe2,
  Handshake,
  ShieldCheck,
  Target,
  Truck,
  Users,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "next-themes";

export default function NosotrosPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#030712] dark:text-white">
      {/* Fondo visual dark */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.15),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.14),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-white/70">
                  Global Pack Center
                </p>
                <h1 className="text-xl font-bold dark:[text-shadow:0_0_20px_rgba(255,90,107,0.35)]">
                  Nosotros
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                Volver al inicio
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Hero institucional */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:border-white/20 dark:bg-white/10 dark:text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Empresa mexicana · +15 años en logística de carga
          </p>

          <h2 className="mt-4 text-2xl font-extrabold leading-tight md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
            Soluciones de carga y paquetería nacional e internacional con enfoque B2B
          </h2>

          <p className="mt-3 max-w-6xl text-sm leading-relaxed text-slate-600 dark:text-white/75">
            En <strong>GPC (Global Pack Center)</strong> ayudamos a empresas a optimizar su operación
            logística mediante una gestión integral de envíos. Nuestro enfoque combina análisis operativo,
            selección estratégica de aliados y seguimiento continuo para mejorar{" "}
            <strong>costo logístico, tiempos de tránsito y confiabilidad de entrega</strong>.
          </p>
        </section>

        {/* Misión / Visión */}
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nuestra misión</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base dark:text-white/75">
                Somos una empresa dedicada a crear soluciones logísticas y de empaque a la medida de nuestros clientes, mediante un servicio de excelencia y seguimiento personalizado.
            </p>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nuestra visión</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base dark:text-white/75">
                Con miras al futuro, buscamos expandir operaciones a las principales ciudades del país y consolidarnos como una empresa referente en soluciones logísticas confiables y cercanas.
            </p>
          </article>
        </section>

        {/* Valores */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nuestros valores</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Principios que guían cada decisión logística con clientes, aliados y equipo.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ValueCard
              icon={ShieldCheck}
              title="Confiabilidad"
              description="Cumplimos procesos y acuerdos operativos para entregar con consistencia y seguridad."
            />
            <ValueCard
              icon={Handshake}
              title="Servicio"
              description="Acompañamiento cercano y respuesta oportuna en cada etapa del envío."
            />
            <ValueCard
              icon={Target}
              title="Enfoque a resultados"
              description="Trabajamos para mejorar costo logístico, tiempos de entrega y desempeño operativo."
            />
            <ValueCard
              icon={Truck}
              title="Disciplina operativa"
              description="Ejecución ordenada y estandarizada para garantizar calidad en cada movimiento."
            />
            <ValueCard
              icon={Users}
              title="Trabajo colaborativo"
              description="Coordinamos cliente, operación y aliados para una logística más eficiente."
            />
            <ValueCard
              icon={Globe2}
              title="Mejora continua"
              description="Ajustamos estrategias y procesos para adaptarnos al crecimiento de tu operación."
            />
          </div>
        </section>

        {/* Propuesta de valor */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-white/15 dark:bg-white/[0.06]">
            <h4 className="text-lg font-bold">¿Por qué GPC?</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-white/80">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Diagnóstico logístico para diseñar una solución de carga alineada a tu operación.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Cobertura nacional e internacional con foco en costo-beneficio y cumplimiento.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Seguimiento de punta a punta con visibilidad y atención personalizada.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Relación de largo plazo orientada a eficiencia, escalabilidad y control operativo.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h4 className="text-lg font-bold">Nuestra esencia</h4>
            <p className="mt-3 text-sm text-slate-700 dark:text-white/80">
              Más que gestionar envíos, actuamos como un aliado estratégico en logística de carga para
              ayudarte a operar mejor, reducir fricción y crecer con confianza.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-white/85">
              <Building2 className="h-4 w-4 text-[#C1374A]" />
              Global Pack Center
            </div>
          </article>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-white/75">
                ¿Buscas una solución logística de carga más eficiente para tu empresa?
              </p>
              <h5 className="mt-1 text-xl font-bold">Estamos listos para apoyarte</h5>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/solicitar-cotizacion"
                className="rounded-xl bg-[#C1374A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9F2436]"
              >
                Solicitar cotización
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                Contacto
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
      <div className="inline-flex rounded-xl border border-rose-100 bg-rose-50 p-2 text-[#C1374A] dark:border-white/15 dark:bg-white/10 dark:text-[#FF7B8F]">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</h4>
      <p className="mt-1 text-sm text-slate-600 dark:text-white/75">{description}</p>
    </article>
  );
}