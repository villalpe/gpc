"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const assurances = [
  "Respuesta de un asesor en un día hábil",
  "Cotización sin compromiso",
  "Cobertura nacional e internacional",
];

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      {/* Fondo base */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#0b1324_0%,#141b30_50%,#220f1f_100%)]" />

      {/* Glows */}
      <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#7c8fb8]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 -z-10 h-80 w-80 rounded-full bg-[#C1374A]/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <Reveal y={18}>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 md:py-24 lg:px-8">
          <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            ¿Listo para optimizar tu operación?
          </p>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Cotiza tu solución logística y de empaque con{" "}
            <span className="text-[#FF5A6B]">Global Pack Center</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
            Diseñamos una solución a la medida para tus envíos nacionales e internacionales, con
            trazabilidad, control operativo y soporte especializado de punta a punta.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/solicitar-cotizacion"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] hover:shadow-[0_10px_25px_rgba(255,90,107,0.35)]"
            >
              Solicitar cotización
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/servicios"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            >
              Ver soluciones logísticas
            </Link>
          </div>

          <ul className="mt-8 flex flex-col items-center justify-center gap-2 text-sm text-white/80 sm:flex-row sm:gap-6">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF5A6B]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}