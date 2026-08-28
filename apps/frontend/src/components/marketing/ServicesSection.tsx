import { Boxes, Route, ShieldCheck, BarChart3, Clock3, Headphones } from "lucide-react";

const services = [
  {
    icon: Boxes,
    title: "Paquetería nacional",
    description:
      "Cobertura amplia para envíos en todo México con opciones estándar y exprés según la urgencia de tu operación.",
  },
  {
    icon: Route,
    title: "Ruteo inteligente",
    description:
      "Definimos la mejor combinación de rutas, tiempos y paqueterías para optimizar costo y cumplimiento de entrega.",
  },
  {
    icon: ShieldCheck,
    title: "Envíos más seguros",
    description:
      "Protocolos operativos y trazabilidad por guía para reducir incidencias y mantener control total de cada paquete.",
  },
  {
    icon: BarChart3,
    title: "Reporteo y visibilidad",
    description:
      "Métricas clave de desempeño logístico para tomar decisiones rápidas y mejorar continuamente tu operación.",
  },
  {
    icon: Clock3,
    title: "Operación ágil",
    description:
      "Procesos eficientes para acelerar recolecciones, despachos y tiempos de tránsito en temporadas de alta demanda.",
  },
  {
    icon: Headphones,
    title: "Atención personalizada",
    description:
      "Acompañamiento cercano de expertos logísticos para resolver incidencias y ajustar tu estrategia cuando lo necesites.",
  },
];

export function ServicesSection() {
  return (
    <section id="servicios" className="scroll-mt-28 relative isolate overflow-hidden bg-surface-3 py-20 text-white md:py-24">
      {/* Profundidad visual */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(255,77,99,0.12),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.20)_0%,rgba(2,6,23,0.45)_100%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
            Servicios
          </p>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
            Soluciones logísticas para crecer
            <span className="block text-brand-red [text-shadow:0_2px_14px_rgba(255,77,99,0.35)]">
              más rápido y con control
            </span>
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">
            Diseñamos servicios flexibles que se adaptan al tamaño y ritmo de tu negocio, con enfoque
            en eficiencia, trazabilidad y experiencia de entrega.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="group rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/40 hover:bg-white/10 hover:shadow-[0_12px_35px_rgba(255,77,99,0.12)]"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-surface-1/70 text-brand-red-soft transition-colors duration-300 group-hover:bg-surface-1/90">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-bold leading-snug text-white">{service.title}</h3>

                <p className="mt-3 text-sm leading-relaxed text-white/75 md:text-[15px]">
                  {service.description}
                </p>

                <div className="mt-5 h-[2px] w-16 rounded-full bg-gradient-to-r from-brand-red-soft to-transparent opacity-90" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}