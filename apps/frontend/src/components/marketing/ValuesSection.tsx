const values = [
  {
    title: "Confiabilidad",
    desc: "Estandarización de productos, servicios, imagen y atención en todas las sucursales.",
  },
  {
    title: "Servicio",
    desc: "Eficiencia y amabilidad en la atención a cada cliente.",
  },
  {
    title: "Disciplina",
    desc: "Apego a las normas y procesos de la empresa.",
  },
  {
    title: "Pasión",
    desc: "Amor por lo que hacemos, reflejado en cada envío.",
  },
];

export function ValuesSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-[var(--ink)] md:text-3xl">Nuestros valores</h2>
        <p className="mt-2 text-[var(--muted)]">
          Principios que guían nuestro servicio en cada operación.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <article
              key={value.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h3 className="text-base font-semibold text-[var(--ink)]">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{value.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}