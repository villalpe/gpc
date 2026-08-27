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
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--ink)] md:text-3xl">Beneficios clave</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--border)] p-5">
              <p className="text-sm font-medium text-[var(--ink)]">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}