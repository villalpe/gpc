"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!emailValid) return;

    setLoading(true);
    // Simulación UX (si luego tienes endpoint real, aquí haces fetch)
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.16),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.16),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#111827_55%,#1f2937_100%)] opacity-95" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-2">
          {/* Panel izquierdo */}
          <section className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 lg:flex">
            <div className="pointer-events-none absolute -left-16 top-6 h-52 w-52 rounded-full bg-[#FF5A6B]/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[#7c8fb8]/20 blur-3xl" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Recuperación de acceso
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">Te ayudamos a volver</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                Ingresa tu correo corporativo y te enviaremos instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <p className="text-xs uppercase tracking-wider text-white/65">Tip</p>
              <p className="mt-1 text-sm text-white/90">
                Revisa también spam/promociones si no ves el correo en tu bandeja principal.
              </p>
            </div>
          </section>

          {/* Panel derecho */}
          <section className="relative bg-white px-6 py-10 text-slate-900 sm:px-10 lg:px-12">
            {/* Logo en esquina superior derecha */}
            <div className="absolute right-6 top-6 hidden sm:block">
              <Link href="/" aria-label="Volver al inicio" className="inline-flex items-center">
                <div className="relative h-20 w-[220px]">
                  <Image
                    src="/images/Logo-fb.png"
                    alt="Global Pack Center"
                    fill
                    className="object-contain object-right"
                    sizes="220px"
                  />
                </div>
              </Link>
            </div>

            <div className="mx-auto w-full max-w-md pt-10 sm:pt-8">
              <h1 className="text-2xl font-bold sm:text-3xl">¿Olvidaste tu contraseña?</h1>
              <p className="mt-2 text-sm text-slate-500">
                Te enviaremos un enlace para restablecerla.
              </p>

              {!submitted ? (
                <form onSubmit={onSubmit} className="mt-8 grid gap-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        placeholder="tu@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15"
                      />
                      {email.length > 0 && (
                        <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
                          {emailValid ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!emailValid || loading}
                    className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Enviando..." : "Enviar enlace"}
                  </button>
                </form>
              ) : (
                <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-800">
                    Listo. Si el correo existe en nuestra base, enviamos un enlace de recuperación a{" "}
                    <span className="font-semibold">{email}</span>.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Link href="/login" className="text-sm font-medium text-[#C1374A] hover:text-[#9F2436]">
                  ← Volver a iniciar sesión
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}