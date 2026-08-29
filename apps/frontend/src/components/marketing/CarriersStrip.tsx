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

// duplicado para loop continuo
const marquee = [...carriers, ...carriers];

export function CarriersStrip() {
  return (
    <section className="relative border-y border-slate-200 bg-slate-50/95">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,77,99,0.08),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aliados logísticos
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Operamos con las mejores paqueterías
            </h2>
          </div>
        </Reveal>

        <div className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50/95 to-transparent" />

          <div className="flex w-max animate-[marquee_26s_linear_infinite] gap-4 group-hover:[animation-play-state:paused]">
            {marquee.map((carrier, idx) => (
              <article
                key={`${carrier.name}-${idx}`}
                className="w-[170px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`relative mx-auto h-16 w-full ${
                    carrier.large ? "max-w-[150px]" : "max-w-[120px]"
                  }`}
                >
                  <Image
                    src={carrier.src}
                    alt={`Logo ${carrier.name}`}
                    fill
                    className="object-contain"
                    sizes="170px"
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