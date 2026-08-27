import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h4 className="text-sm font-bold text-[var(--ink)]">Global Pack Center</h4>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Soluciones de mensajería y paquetería con enfoque corporativo.
          </p>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-[var(--ink)]">Compañía</h5>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li><Link href="/nosotros">Nosotros</Link></li>
            <li><Link href="/servicios">Servicios</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-[var(--ink)]">Legal</h5>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li><Link href="#">Términos y condiciones</Link></li>
            <li><Link href="#">Aviso de privacidad</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-[var(--ink)]">Contacto</h5>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <li>contacto@globalpackcenter.com</li>
            <li>+52 55 0000 0000</li>
            <li>CDMX, México</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-[var(--muted)] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Global Pack Center. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}