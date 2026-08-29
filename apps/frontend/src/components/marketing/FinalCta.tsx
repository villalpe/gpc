"use client";

import Link from "next/link";
import { CursorGlow } from "@/components/marketing/CursorGlow";
import { Reveal } from "@/components/marketing/Reveal";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden text-white">
      {/* Fondo base */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#0b1324_0%,#1a2238_45%,#2b1630_100%)]" />

      {/* Capas decorativas */}
      <div className="pointer-events-none absolute -left-20 top-[-80px] -z-10 h-72 w-72 rounded-full bg-[#7c8fb8]/25 blur-3xl" />
      <div className="pointer-events-none absolute right-[-90px] bottom-[-100px] -z-10 h-80 w-80 rounded-full bg-[#8b2c3e]/30 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.12),transparent_45%)]" />

      {/* Cursor glow dinámico */}
      <CursorGlow color="255,90,107" size={340} strength={0.17} />
      <CursorGlow color="124,143,184" size={280} strength={0.12} className="mix-blend-screen" />
      <Reveal y={18}>
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          ¿Listo para optimizar tu logística?
        </p>

        <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
          Cotiza tu envío con
          <span className="block bg-gradient-to-r from-rose-300 via-white to-sky-200 bg-clip-text text-transparent">
            Global Pack Center
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
          Compara paqueterías, mejora tiempos de entrega y escala tu operación con
          soporte especializado.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] hover:shadow-[0_10px_25px_rgba(255,90,107,0.35)]"
          >
            Solicitar cotización
          </Link>

          <Link
            href="/servicios"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
          >
            Ver servicios
          </Link>
        </div>
      </div>
      </Reveal>
    </section>
  );
}