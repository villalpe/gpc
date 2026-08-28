import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const trustPoints = [
  "Más de 15 años de experiencia en logística",
  "Cobertura nacional con aliados estratégicos",
  "Optimización de costos y tiempos de entrega",
];

const metrics = [
  { label: "Años de experiencia", value: "15+" },
  { label: "Aliados logísticos", value: "6+" },
  { label: "Enfoque", value: "B2B / Corporativo" },
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden text-white">
{/* Fondo con imagen responsive */}
<div className="absolute inset-0 -z-20">
  <picture>
    {/* Mobile */}
    <source
      media="(max-width: 767px)"
      srcSet="/images/imageHero640.jpg"
    />
    {/* Desktop fallback */}
    <img
      src="/images/imagenHero2.jpg"
      alt="Operación logística Global Pack Center"
      className="h-full w-full object-cover object-center"
    />
  </picture>
</div>

        {/* Overlay más ligero */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(15,23,42,0.58)_0%,rgba(15,23,42,0.42)_45%,rgba(15,23,42,0.22)_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(164,42,58,0.12),transparent_45%)]" />

      <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:min-h-[82vh] md:py-28 lg:grid-cols-2 lg:px-8">
        {/* Columna izquierda */}
        <div>
        <p className="inline-flex items-center rounded-full border border-white/30 bg-black/12 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md md:text-base">
        <span className="bg-gradient-to-r from-[#FF5A6B] via-[#FF3D53] to-[#C9CED6] bg-clip-text text-transparent [text-shadow:0_2px_14px_rgba(255,61,83,0.35)]">
            Global Pack Center
        </span>
        <span className="text-white/90"> · Soluciones logísticas</span>
        </p>

          {/* Título corrido + rojo más visible */}
          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            Tu operación de envíos,{" "}
<span className="text-[#FF4D63] [text-shadow:0_2px_16px_rgba(255,77,99,0.45)]">
  más rápida, rentable y confiable.
</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            Integramos las mejores opciones de paquetería para tu negocio con atención
            personalizada, control operativo y cobertura nacional e internacional.
          </p>

          <ul className="mt-6 space-y-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-white/95 md:text-base">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="pointer-events-auto mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Solicitar asesoría
            </Link>

            <Link
              href="/#servicios"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ver servicios
            </Link>
          </div>
        </div>

        {/* Columna derecha: panel KPI */}
        <div className="relative">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md md:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((item) => {
                const isFocus = item.label === "Enfoque";

                return (
                <div
                    key={item.label}
                    className="rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center min-h-[112px] flex flex-col items-center justify-center"
                >
                    <p
                    className={
                        isFocus
                        ? "text-xl font-extrabold md:text-2xl"   // <- más chico para B2B / Corporativo
                        : "text-2xl font-extrabold md:text-3xl"
                    }
                    >
                    {item.value}
                    </p>

                    <p
                    className={
                        isFocus
                        ? "mt-1 max-w-[120px] text-[11px] leading-tight text-white/75 md:text-xs"
                        : "mt-1 max-w-[120px] text-[11px] leading-tight text-white/75 md:text-sm"
                    }
                    >
                    {item.label}
                    </p>
                </div>
                );
            })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Compromiso GPC</p>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Llevamos tu negocio más lejos con soluciones logísticas hechas a tu medida.
              </p>
            </div>
          </div>

          {/* Badge centrado debajo del panel */}
          <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur whitespace-nowrap">
            Cobertura nacional e internacional + seguimiento personalizado
          </div>
        </div>
      </div>
    </section>
  );
}