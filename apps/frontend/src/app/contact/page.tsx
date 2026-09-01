"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock3,
  Send,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ThemeMode = "light" | "dark";

export default function ContactPage() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const isDark = theme === "dark";

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const nameValid = name.trim().length >= 3;
  const msgValid = message.trim().length >= 10;
  const canSubmit = nameValid && emailValid && msgValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);

    if (!canSubmit) {
      setError("Por favor completa nombre, correo válido y mensaje (mínimo 10 caracteres).");
      return;
    }

    setLoading(true);
    try {
      // Demo UX (si luego tienes endpoint real, reemplaza por fetch)
      await new Promise((r) => setTimeout(r, 900));
      setDone(true);
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setError("No se pudo enviar el formulario. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={
        isDark
          ? "min-h-screen bg-[#030712] text-white"
          : "min-h-screen bg-slate-100 text-slate-900"
      }
    >
      {/* Background FX */}
      <div className="relative overflow-hidden">
        <div
          className={
            isDark
              ? "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.16),transparent_35%)]"
              : "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.10),transparent_35%)]"
          }
        />
        <div
          className={
            isDark
              ? "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.14),transparent_40%)]"
              : "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(124,143,184,0.10),transparent_40%)]"
          }
        />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Top bar */}
          <header
            className={
              isDark
                ? "rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm"
                : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" aria-label="Volver al inicio" className="inline-flex items-center">
                {isDark ? (
                    // DARK: con contenedor claro para contraste
                    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1">
                    <div className="relative h-22 w-[155px]">
                        <Image
                        src="/images/Logo-fb.png"
                        alt="Global Pack Center"
                        fill
                        priority
                        className="object-contain"
                        sizes="155px"
                        />
                    </div>
                    </div>
                ) : (
                    // LIGHT: sin borde/contenedor y más grande
                    <div className="relative h-16 w-[220px] sm:h-[86px] sm:w-[198px]">
                    <Image
                        src="/images/Logo-fb.png"
                        alt="Global Pack Center"
                        fill
                        priority
                        className="object-contain object-left"
                        sizes="(max-width: 640px) 200px, 198px"
                    />
                    </div>
                )}
                </Link>

                <div>
                  <p
                    className={
                      isDark
                        ? "text-xs uppercase tracking-[0.14em] text-white/70"
                        : "text-xs uppercase tracking-[0.14em] text-slate-500"
                    }
                  >
                    Global Pack Center
                  </p>
                  <h1
                    className={
                      isDark
                        ? "text-xl font-bold [text-shadow:0_0_20px_rgba(255,90,107,0.35)]"
                        : "text-xl font-bold text-slate-900"
                    }
                  >
                    Contacto
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={
                    isDark
                      ? "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
                      : "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  }
                >
                  Volver al inicio
                </Link>

                <button
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  className={
                    isDark
                      ? "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                      : "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  }
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          </header>

          {/* Main content */}
          <section className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left - intro + cards */}
            <aside className="lg:col-span-5">
              <article
                className={
                  isDark
                    ? "rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm"
                    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                }
              >
                <p
                  className={
                    isDark
                      ? "inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80"
                      : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436]"
                  }
                >
                  Hablemos de tu operación
                </p>

                <h2
                  className={
                    isDark
                      ? "mt-4 text-2xl font-extrabold leading-tight [text-shadow:0_0_22px_rgba(255,90,107,0.25)]"
                      : "mt-4 text-2xl font-extrabold leading-tight text-slate-900"
                  }
                >
                  Diseñemos una solución logística a tu medida
                </h2>

                <p className={isDark ? "mt-3 text-sm text-white/75" : "mt-3 text-sm text-slate-600"}>
                  Cuéntanos tus necesidades operativas y te proponemos una estrategia práctica para
                  optimizar tiempos, costos y visibilidad de tus envíos.
                </p>
              </article>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Mail, label: "Correo", value: "contacto@globalpackcenter.com" },
                  { icon: Phone, label: "Teléfono", value: "+52 442 223 4413" },
                  { icon: MapPin, label: "Ubicación", value: "Querétaro, MX" },
                  { icon: Clock3, label: "Horario", value: "Lun - Vie · 9:00 a 18:00" },
                ].map((item) => (
                  <article
                    key={item.label}
                    className={
                      isDark
                        ? "rounded-xl border border-white/15 bg-white/[0.06] p-4"
                        : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    }
                  >
                    <div
                      className={
                        isDark
                          ? "mb-2 inline-flex rounded-lg border border-white/20 bg-white/10 p-2 text-rose-300"
                          : "mb-2 inline-flex rounded-lg border border-rose-100 bg-rose-50 p-2 text-[#C1374A]"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className={isDark ? "text-xs text-white/65" : "text-xs text-slate-500"}>{item.label}</p>
                    <p className={isDark ? "mt-1 text-sm font-medium text-white" : "mt-1 text-sm font-medium text-slate-900"}>
                      {item.value}
                    </p>
                  </article>
                ))}
              </div>
            </aside>

            {/* Right - form */}
            <div className="lg:col-span-7">
              <article
                className={
                  isDark
                    ? "rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm"
                    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                }
              >
                <h3 className={isDark ? "text-xl font-bold text-white" : "text-xl font-bold text-slate-900"}>
                  Envíanos un mensaje
                </h3>
                <p className={isDark ? "mt-1 text-sm text-white/70" : "mt-1 text-sm text-slate-600"}>
                  Te responderemos con una propuesta inicial y siguientes pasos.
                </p>

                <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Nombre completo"
                    value={name}
                    onChange={setName}
                    placeholder="Tu nombre"
                    isDark={isDark}
                    required
                    valid={name.length === 0 ? undefined : nameValid}
                  />
                  <Field
                    label="Empresa"
                    value={company}
                    onChange={setCompany}
                    placeholder="Nombre de tu empresa"
                    isDark={isDark}
                  />
                  <Field
                    label="Correo electrónico"
                    value={email}
                    onChange={setEmail}
                    placeholder="tu@empresa.com"
                    isDark={isDark}
                    type="email"
                    required
                    valid={email.length === 0 ? undefined : emailValid}
                  />
                  <Field
                    label="Teléfono"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+52..."
                    isDark={isDark}
                  />

                  <div className="md:col-span-2">
                    <label
                      className={
                        isDark
                          ? "mb-1.5 block text-sm font-medium text-white/85"
                          : "mb-1.5 block text-sm font-medium text-slate-700"
                      }
                    >
                      Mensaje
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      placeholder="Cuéntanos volumen mensual, destinos, retos actuales, etc."
                      className={
                        isDark
                          ? "w-full rounded-xl border border-white/20 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#FF7B8F] focus:ring-4 focus:ring-[#FF7B8F]/20"
                          : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15"
                      }
                    />
                    <p className={isDark ? "mt-1 text-xs text-white/55" : "mt-1 text-xs text-slate-500"}>
                      Mínimo 10 caracteres.
                    </p>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={isDark ? "text-xs text-white/60" : "text-xs text-slate-500"}>
                      Al enviar aceptas nuestro aviso de privacidad y contacto comercial.
                    </p>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={
                        isDark
                          ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C1374A] px-5 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                          : "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C1374A] px-5 text-sm font-semibold text-white transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
                      }
                    >
                      <Send className="h-4 w-4" />
                      {loading ? "Enviando..." : "Enviar mensaje"}
                    </button>
                  </div>

                  {done && (
                    <div
                      className={
                        isDark
                          ? "md:col-span-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                          : "md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        ¡Mensaje enviado! Te contactaremos pronto.
                      </span>
                    </div>
                  )}

                  {error && (
                    <div
                      className={
                        isDark
                          ? "md:col-span-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
                          : "md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </span>
                    </div>
                  )}
                </form>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  isDark,
  type = "text",
  required = false,
  valid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isDark: boolean;
  type?: string;
  required?: boolean;
  valid?: boolean;
}) {
  return (
    <div>
      <label
        className={
          isDark
            ? "mb-1.5 block text-sm font-medium text-white/85"
            : "mb-1.5 block text-sm font-medium text-slate-700"
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={
            isDark
              ? "w-full rounded-xl border border-white/20 bg-slate-900/60 px-4 py-2.5 pr-10 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#FF7B8F] focus:ring-4 focus:ring-[#FF7B8F]/20"
              : "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF5A6B] focus:ring-4 focus:ring-[#FF5A6B]/15"
          }
        />

        {valid !== undefined && (
          <span className="pointer-events-none absolute inset-y-0 right-3 inline-flex items-center">
            {valid ? (
              <CheckCircle2 className={isDark ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-emerald-600"} />
            ) : (
              <AlertCircle className={isDark ? "h-4 w-4 text-amber-300" : "h-4 w-4 text-amber-600"} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}