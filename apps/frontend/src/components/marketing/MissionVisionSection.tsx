export function MissionVisionSection() {
  return (
    <section className="bg-[var(--bg)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--ink)]">Nuestra misión</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            Somos una empresa dedicada a crear soluciones logísticas y de empaque
            a la medida de nuestros clientes, mediante un servicio de excelencia y
            seguimiento personalizado.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--ink)]">Nuestra visión</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            Con miras al futuro, buscamos expandir operaciones a las principales
            ciudades del país y consolidarnos como una empresa referente en
            soluciones logísticas confiables y cercanas.
          </p>
        </article>
      </div>
    </section>
  );
}