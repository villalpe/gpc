const steps = [
  { title: "1. Diagnóstico", desc: "Analizamos tu operación y volumen de envíos." },
  { title: "2. Integración", desc: "Conectamos paqueteras y reglas de negocio." },
  { title: "3. Optimización", desc: "Mejoramos costos, tiempos y trazabilidad." },
];

export function ProcessSteps() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--ink)] md:text-3xl">Cómo trabajamos</h2>
        <p className="mt-2 text-[var(--muted)]">Proceso simple para resultados medibles.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.title} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <h3 className="text-base font-semibold text-[var(--ink)]">{s.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}