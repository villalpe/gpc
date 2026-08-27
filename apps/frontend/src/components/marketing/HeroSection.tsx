import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-[var(--bg)]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)] ring-1 ring-[var(--border)]">
            Soluciones logísticas corporativas
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[var(--ink)] md:text-5xl">
            Tu operación de envíos, más rápida, clara y rentable.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
            En Global Pack Center conectamos tu negocio con las mejores paqueteras
            para optimizar tiempos de entrega, costos y visibilidad operativa.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
            >
              Solicitar asesoría
            </Link>
            <Link
              href="/servicios"
              className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-slate-50"
            >
              Ver servicios
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs text-[var(--muted)]">Ahorro promedio</p>
                <p className="mt-2 text-2xl font-bold text-[var(--ink)]">-18%</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs text-[var(--muted)]">Entregas a tiempo</p>
                <p className="mt-2 text-2xl font-bold text-[var(--ink)]">98.2%</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-slate-100 p-4">
                <p className="text-xs text-[var(--muted)]">Cobertura</p>
                <p className="mt-2 text-2xl font-bold text-[var(--ink)]">Nacional + Internacional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}