const benefits = [
  "Comparador de paqueterías por costo/tiempo",
  "Visibilidad operativa de punta a punta",
  "Escalabilidad para crecimiento multi-sucursal",
  "Soporte especializado para operación crítica",
  "Mejores decisiones con datos",
  "Experiencia de cliente final más confiable",
];

export function BenefitsGrid() {
  return (
    <section className="relative isolate overflow-hidden bg-surface-1 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,77,99,0.10),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <h2 className="text-2xl font-bold md:text-3xl">
          Beneficios clave
          <span className="mt-1 block text-brand-red">para tu operación logística</span>
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-red/40 hover:bg-white/10"
            >
              <p className="text-sm font-medium text-white/90">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}