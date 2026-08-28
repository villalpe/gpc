import { ClipboardList, SearchCheck, Truck, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "1. Diagnóstico de operación",
    description:
      "Analizamos tu volumen de envíos, zonas de cobertura y necesidades de servicio para diseñar una solución logística realista y escalable.",
  },
  {
    icon: SearchCheck,
    title: "2. Selección de estrategia",
    description:
      "Comparamos opciones de paquetería, tiempos de tránsito y costos para definir la combinación más eficiente para tu negocio.",
  },
  {
    icon: Truck,
    title: "3. Implementación y ejecución",
    description:
      "Integramos el flujo operativo y comenzamos envíos con seguimiento puntual, coordinación activa y atención personalizada.",
  },
  {
    icon: BarChart3,
    title: "4. Monitoreo y optimización",
    description:
      "Medimos resultados, detectamos oportunidades de mejora y ajustamos continuamente para reducir costos y mejorar entregas.",
  },
];

export function ProcessSteps() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-2 py-20 text-white md:py-24">
      {/* Capas sutiles de profundidad */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,77,99,0.14),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,23,42,0.10)_0%,rgba(2,6,23,0.35)_100%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            Cómo trabajamos
          </p>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
            Nuestro proceso logístico
            <span className="block text-brand-red [text-shadow:0_2px_14px_rgba(255,77,99,0.35)]">
              claro, ágil y orientado a resultados
            </span>
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">
            Te acompañamos desde el diagnóstico inicial hasta la optimización continua para que
            cada envío aporte eficiencia, control y crecimiento a tu operación.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="group relative rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/40 hover:bg-white/10 hover:shadow-[0_12px_35px_rgba(255,77,99,0.12)] md:p-6"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-surface-1/70 text-brand-redSoft transition-colors duration-300 group-hover:bg-surface-1/90">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-base font-bold leading-snug text-white md:text-lg">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-white/75 md:text-[15px]">
                  {step.description}
                </p>

                <div className="mt-5 h-[2px] w-14 rounded-full bg-gradient-to-r from-brand-redSoft to-transparent opacity-90" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}