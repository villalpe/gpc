"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Servicios", href: "/servicios" },
  { label: "Contacto", href: "/contacto" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/20 bg-slate-500/70 shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-xl supports-[backdrop-filter]:bg-slate-500/60">      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Global Pack Center - Inicio">
          <div className="relative h-28 w-[220px] sm:w-[250px] md:w-[290px]">
            <Image
              src="/images/Logo-fb.png"
              alt="Global Pack Center"
              fill
              priority
              className="object-contain object-left brightness-110 contrast-110 drop-shadow-[0_2px_10px_rgba(255,255,255,0.30)]"
              sizes="(max-width: 640px) 220px, (max-width: 768px) 250px, 290px"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-base font-semibold text-white/90 transition-colors duration-200 hover:text-[#FF5A6B]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/login"
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
          >
            Iniciar sesión
          </Link>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir/cerrar menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-white/15 bg-slate-900/90 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-base font-semibold text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-[#FF5A6B]"
              >
                {item.label}
              </Link>
            ))}
          <Link
            href="/login"
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)]"
          >
            Iniciar sesión
          </Link>
          </div>
        </div>
      )}
    </header>
  );
}