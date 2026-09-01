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
            Empresa mexicana · +15 años en el mercado
          </p>

          <h2 className="mt-4 text-2xl font-extrabold leading-tight md:text-3xl dark:bg-gradient-to-r dark:from-white dark:via-rose-100 dark:to-white dark:bg-clip-text dark:text-transparent">
            Soluciones de mensajería y paquetería nacional e internacional al mejor precio
          </h2>

            <p className="mt-3 max-w-6xl text-sm leading-relaxed text-slate-600 dark:text-white/75">
            En <strong>GPC (Global Pack Center)</strong> contamos con más de 15 años de experiencia especializada en paquetería y logística. Nuestro core es conectar a cada cliente con la mejor alternativa de envío, comparando opciones con apoyo de nuestros aliados estratégicos para optimizar <strong>costo, tiempo de entrega y confiabilidad</strong>.
            </p>
        </section>

        {/* Misión / Visión */}
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nuestra misión</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base dark:text-white/75">
              Somos una empresa dedicada a crear soluciones logísticas y de empaque a la medida de nuestros clientes,
              mediante un servicio de excelencia y seguimiento personalizado.
            </p>
          </article>

          <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-[#FF7B8F]/60 dark:hover:bg-white/[0.10]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF5A6B] via-rose-400 to-transparent" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Nuestra visión</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base dark:text-white/75">
              Con miras al futuro, buscamos expandir operaciones a las principales ciudades del país y consolidarnos
              como una empresa referente en soluciones logísticas confiables, cercanas y de alto valor.
            </p>
          </article>
        </section>

        {/* Valores */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nuestros valores</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-white/70">
            Principios que guían nuestra relación con clientes, aliados y equipo.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ValueCard
              icon={ShieldCheck}
              title="Confianza"
              description="Operamos con transparencia, compromiso y cumplimiento en cada envío."
            />
            <ValueCard
              icon={Handshake}
              title="Servicio"
              description="Acompañamiento cercano, atención oportuna y soluciones personalizadas."
            />
            <ValueCard
              icon={Target}
              title="Enfoque a resultados"
              description="Priorizamos eficiencia logística y ahorro real para nuestros clientes."
            />
            <ValueCard
              icon={Truck}
              title="Eficiencia operativa"
              description="Coordinamos procesos ágiles para mejorar tiempos y experiencia de entrega."
            />
            <ValueCard
              icon={Users}
              title="Trabajo en equipo"
              description="Colaboramos con clientes y aliados para construir soluciones de largo plazo."
            />
            <ValueCard
              icon={Globe2}
              title="Innovación continua"
              description="Mejoramos constantemente nuestras prácticas para responder al mercado."
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
                Comparación inteligente entre aliados para identificar la mejor opción de envío.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Cobertura nacional e internacional con enfoque en costo-beneficio.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Asesoría logística para operaciones frecuentes o requerimientos especiales.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#C1374A]" />
                Acompañamiento comercial y operativo orientado a relaciones de largo plazo.
              </li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.06]">
            <h4 className="text-lg font-bold">Nuestra esencia</h4>
            <p className="mt-3 text-sm text-slate-700 dark:text-white/80">
              Más que una paquetería, somos un socio estratégico que te ayuda a enviar mejor, pagar lo justo y crecer
              con una logística confiable.
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
                ¿Te gustaría cotizar tus envíos con la mejor alternativa disponible?
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