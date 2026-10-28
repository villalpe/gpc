"use client";

import Image from "next/image";
import { Reveal } from "@/components/marketing/Reveal";

type CarrierLogo = {
  name: string;
  src: string;
  large?: boolean;
};

const carriers: CarrierLogo[] = [
  { name: "FedEx", src: "/images/fedexlogo.png", large: true },
  { name: "DHL", src: "/images/dhl.png" },
  { name: "UPS", src: "/images/ups.png" },
  { name: "Estafeta", src: "/images/estafeta.png" },
  { name: "Redpack", src: "/images/redpack.png" },
  { name: "Paquete Express", src: "/images/paqueteexpress.png" },
];

const marquee = [...carriers, ...carriers];

export function CarriersStrip() {
  return (
    <section className="relative isolate overflow-hidden border-y border-slate-200 bg-white py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_14%,rgba(193,55,74,0.07),transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal y={14}>
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Aliados logísticos
            </p>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Operamos con las principales paqueterías
            </h2>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              Integramos múltiples transportistas para darte cobertura, flexibilidad y mejores tiempos de respuesta.
            </p>
          </div>
        </Reveal>

        <div className="group relative overflow-hidden">
          {/* Fades laterales */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

          {/* Marquee */}
          <div
            className="
              flex w-max gap-4
              motion-safe:animate-[marquee_28s_linear_infinite]
              motion-reduce:animate-none
              group-hover:[animation-play-state:paused]
            "
          >
            {marquee.map((carrier, idx) => (
              <article
                key={`${carrier.name}-${idx}`}
                className="w-[172px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/30 hover:shadow-md"
                aria-label={carrier.name}
              >
                <div
                  className={`relative mx-auto h-16 w-full ${
                    carrier.large ? "max-w-[150px]" : "max-w-[124px]"
                  }`}
                >
                  <Image
                    src={carrier.src}
                    alt={`Logo ${carrier.name}`}
                    fill
                    className="object-contain grayscale opacity-75 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                    sizes="172px"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}