import Link from "next/link";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[var(--ink)] px-6 py-10 text-white md:px-10">
        <h3 className="text-2xl font-bold md:text-3xl">¿Listo para optimizar tu operación logística?</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
          Te ayudamos a integrar mejores opciones de mensajería y paquetería para tu negocio.
        </p>
        <div className="mt-6">
          <Link
            href="/contacto"
            className="inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
          >
            Hablar con un asesor
          </Link>
        </div>
      </div>
    </section>
  );
}