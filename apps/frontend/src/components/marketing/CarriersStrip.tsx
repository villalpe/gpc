const carriers = ["FedEx", "DHL", "UPS", "Estafeta", "Redpack", "Skydropx"];

export function CarriersStrip() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Operamos con aliados logísticos
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {carriers.map((c) => (
            <div key={c} className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-center text-sm font-semibold text-[var(--ink)]">
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}