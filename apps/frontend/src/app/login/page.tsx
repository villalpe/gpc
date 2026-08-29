"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const passValid = useMemo(() => password.length >= 6, [password]);
  const canSubmit = emailValid && passValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!emailValid || !passValid) {
      setError("Verifica que el correo sea válido y la contraseña tenga al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error();
      router.push("/dashboard");
    } catch {
      setError("Credenciales inválidas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.16),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.16),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#020617_0%,#111827_55%,#1f2937_100%)] opacity-95" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_20px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-2">
          {/* Panel izquierdo branding (sin logo) */}
          <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 lg:flex">
            <div className="pointer-events-none absolute -left-16 top-6 h-52 w-52 rounded-full bg-[#FF5A6B]/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[#7c8fb8]/20 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Plataforma logística
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">Bienvenido de vuelta</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                Accede a tu panel para gestionar envíos, monitorear operaciones y tomar decisiones con datos en tiempo real.
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <p className="text-xs uppercase tracking-wider text-white/65">Seguridad</p>
              <p className="mt-1 text-sm text-white/90">Acceso protegido para usuarios autorizados.</p>
            </div>
          </section>

          {/* Panel derecho formulario */}
          <section className="relative bg-white px-6 py-10 text-slate-900 sm:px-10 lg:px-12">
            {/* Logo esquina superior derecha */}
            <div className="absolute right-6 top-6 hidden sm:block">
              <Link href="/" aria-label="Volver al inicio" className="inline-flex items-center">
                <div className="relative h-20 w-[220px]">
                  <Image
                    src="/images/Logo-fb.png"
                    alt="Global Pack Center"
                    fill
                    priority
                    className="object-contain object-right"
                    sizes="220px"
                  />
                </div>
              </Link>
            </div>

            <div className="mx-auto w-full max-w-md pt-10 sm:pt-8">
              <div className="mb-8 sm:hidden">
                <Link href="/" className="inline-flex items-center">
                  <div className="relative h-20 w-[220px]">
                    <Image
                      src="/images/Logo-fb.png"
                      alt="Global Pack Center"
                      fill
                      className="object-contain object-left"
                      sizes="220px"
                    />
                  </div>
                </Link>
              </div>

              {/* Volver al landing */}
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>

              <h1 className="text-2xl font-bold sm:text-3xl">Iniciar sesión</h1>
              <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales para continuar.</p>

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

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-20 text-sm outline-none transition focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15"
                    />

                    <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                      {password.length > 0 &&
                        (passValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        ))}

                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres.</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#FF5A6B] focus:ring-[#FF5A6B]" />
                    Recordarme
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-[#C1374A] hover:text-[#9F2436]">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[#C1374A] px-4 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>

                {/* Botón secundario a recuperación */}
                <Link
                  href="/forgot-password"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Recuperar acceso
                </Link>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </form>

              <p className="mt-6 text-xs text-slate-500">
                Al iniciar sesión aceptas nuestras políticas de seguridad y uso interno.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}