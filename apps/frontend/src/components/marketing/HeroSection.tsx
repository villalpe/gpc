"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const trustPoints = [
  "Más de 15 años de experiencia en logística de carga",
  "Cobertura nacional con aliados estratégicos de transporte",
  "Optimización de costos, rutas y tiempos de operación",
];

const metrics = [
  { label: "Años de experiencia", value: "15+" },
  { label: "Cobertura operativa", value: "Nacional e Internacional" },
  { label: "Enfoque", value: "B2B / Corporativo" },
];

export function HeroSection() {
  const handleScrollToServices = () => {
    const section = document.getElementById("servicios");
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative isolate overflow-hidden text-white">
      {/* Fondo responsive */}
      <div className="absolute inset-0 -z-20 brightness-[1.04] contrast-[1.03] saturate-[1.04]">
        {/* Mobile */}
        <Image
          src="/images/imageHero640.jpg"
          alt="Operación logística de carga Global Pack Center"
          fill
          priority
          sizes="(max-width: 767px) 100vw"
          className="object-cover object-[60%_20%] md:hidden"
        />

        {/* Desktop */}
        <Image
          src="/images/imageHero9.jpg"
          alt="Operación logística de carga Global Pack Center"
          fill
          priority
          sizes="(min-width: 768px) 100vw"
          className="hidden object-contain object-center md:block"
        />
      </div>

      {/* Overlay balanceado */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(2,6,23,0.64)_0%,rgba(2,6,23,0.38)_44%,rgba(2,6,23,0.12)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_16%,rgba(255,210,160,0.10),transparent_42%)]" />

      {/* Contenedor principal */}
      <div className="mx-auto grid min-h-[100svh] max-w-[90rem] items-center gap-8 px-4 py-12 sm:px-6 md:min-h-[92vh] md:gap-12 md:py-20 lg:grid-cols-2 lg:px-8">
        {/* Columna izquierda */}
        <div>
          <p className="inline-flex items-center rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md sm:px-4 sm:text-sm md:text-base">
            <span className="bg-gradient-to-r from-[#FF5A6B] via-[#FF3D53] to-[#C9CED6] bg-clip-text text-transparent">
              Global Pack Center
            </span>
            <span className="text-white/90"> · Soluciones logísticas de carga</span>
          </p>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.24)] sm:text-5xl md:mt-6 md:text-4xl lg:text-5xl">
            Tu operación de carga,{" "}
            <span className="text-[#E94A67] [text-shadow:0_2px_8px_rgba(0,0,0,0.20)]">
              más eficiente, rentable y confiable.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg md:mt-6 md:text-lg">
            Soluciones de carga y logística B2B a la medida, con cobertura nacional e internacional y seguimiento personalizado.
          </p>

          <ul className="mt-5 space-y-2 md:mt-6">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-white/95 sm:text-base">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="pointer-events-auto mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Solicitar asesoría
            </Link>

            <button
              type="button"
              onClick={handleScrollToServices}
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Ver servicios
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="relative mt-2 md:mt-0">
          <div className="rounded-3xl border border-white/20 bg-white/12 p-4 shadow-2xl backdrop-blur-md sm:p-5 md:p-6">
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {metrics.map((item) => {
                const isFocus = item.label === "Enfoque";
                const isCoverage = item.label === "Cobertura operativa";

                return (
                  <div
                    key={item.label}
                    className={`min-h-[104px] rounded-2xl border border-white/15 bg-black/25 text-center flex flex-col items-center justify-center md:min-h-[112px] ${
                      isCoverage ? "px-6 py-6 md:px-7 md:py-6" : "px-4 py-4"
                    }`}
                  >
                    <p
                      className={
                        isCoverage
                          ? "text-xl font-extrabold leading-tight md:text-2xl"
                          : isFocus
                          ? "text-xl font-extrabold md:text-2xl"
                          : "text-2xl font-extrabold md:text-3xl"
                      }
                    >
                      {item.value}
                    </p>

                    <p
                      className={
                        isFocus
                          ? "mt-1 max-w-[120px] text-[11px] leading-tight text-white/75 md:text-xs"
                          : isCoverage
                          ? "mt-2 max-w-[210px] text-[11px] leading-tight text-white/75 md:max-w-[230px] md:text-sm"
                          : "mt-1 max-w-[120px] text-[11px] leading-tight text-white/75 md:text-sm"
                      }
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-4 md:mt-4">
              <p className="text-xs uppercase tracking-wider text-white/70">Compromiso GPC</p>
              <p className="mt-2 text-sm text-white/90 md:text-base">
                Creamos soluciones logísticas de carga a la medida, con seguimiento personalizado de punta a punta.
              </p>
            </div>
          </div>

          <div className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur md:text-xs">
            Cobertura nacional e internacional + seguimiento personalizado
          </div>
        </div>
      </div>
    </section>
  );
}