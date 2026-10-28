"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const companyLinks = [
  { label: "Nosotros", href: "/nosotros" },
  { label: "Servicios", href: "/servicios" },
  { label: "Contacto", href: "/contact" },
];

const legalLinks = [
  { label: "Términos y condiciones", href: "#" },
  { label: "Aviso de privacidad", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-slate-200 bg-white text-slate-900">
      {/* Fondo suave */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(193,55,74,0.07),transparent_34%)]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* Brand */}
        <div className="lg:col-span-4">
          <h4 className="text-lg font-extrabold tracking-tight text-slate-900">Global Pack Center</h4>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 md:text-[15px]">
            Soluciones de paquetería y carga con enfoque corporativo:
            más control operativo, mejor trazabilidad y entregas confiables.
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
          >
            Solicitar asesoría
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Compañía */}
        <div className="lg:col-span-2">
          <h5 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Compañía</h5>
          <ul className="mt-4 space-y-2.5">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className="lg:col-span-3">
          <h5 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Legal</h5>
          <ul className="mt-4 space-y-2.5">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-600 transition-colors hover:text-[var(--primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div className="lg:col-span-3">
          <h5 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">Contacto</h5>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>contacto@globalpackcenter.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>+52 442 223 4413</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>Querétaro, México</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} Global Pack Center. Todos los derechos reservados.</p>
          <p>Diseñado para operación logística B2B de alto desempeño.</p>
        </div>
      </div>
    </footer>
  );
}