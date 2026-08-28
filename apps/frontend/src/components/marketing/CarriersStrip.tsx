import Image from "next/image";

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

export function CarriersStrip() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Aliados logísticos
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--ink)] md:text-3xl">
            Operamos con las mejores paqueteras
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {carriers.map((carrier) => (
            <article
              key={carrier.name}
              className="group rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div
                className={`relative mx-auto h-16 w-full ${
                  carrier.large ? "max-w-[200px]" : "max-w-[140px]"
                }`}
              >
                <Image
                  src={carrier.src}
                  alt={`Logo ${carrier.name}`}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 120px, (max-width: 1024px) 130px, 165px"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}