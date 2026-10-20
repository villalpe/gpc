import Image from "next/image";
import { Search } from "lucide-react";
import type { FormEventHandler } from "react";

type TrackingHeaderProps = {
  /* Marca */
  logoSrc: string;
  logoAlt: string;
  /** Clases completas de Tailwind para la franja superior, ej. "from-[#4D148C] to-[#FF6600]" */
  accentGradient: string;

  /* Textos */
  eyebrow?: string;
  title: string;
  description?: string;
  inputLabel: string;
  placeholder: string;
  helperText?: string;
  buttonLabel?: string;
  loadingLabel?: string;
  showStatusBadge?: boolean;

  /* Formulario */
  value: string;
  onChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  loading: boolean;
  inputId?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  uppercase?: boolean;
};

export default function TrackingHeader({
  logoSrc,
  logoAlt,
  accentGradient,
  eyebrow = "Seguimiento de envíos",
  title,
  description,
  inputLabel,
  placeholder,
  helperText,
  buttonLabel = "Rastrear",
  loadingLabel = "Buscando...",
  showStatusBadge = true,
  value,
  onChange,
  onSubmit,
  loading,
  inputId = "tracking-input",
  inputMode = "text",
  maxLength,
  uppercase = false,
}: TrackingHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md dark:border-white/15 dark:bg-white/[0.06]">
      {/* Franja de marca */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accentGradient}`} />

      <div className="space-y-6 p-5 md:p-7">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-28 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={96}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9F2436] dark:text-[#FF9AAA]">
                {eyebrow}
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="mt-0.5 text-sm text-slate-600 dark:text-white/70">{description} <strong>Sandbox Mode</strong></p>
              )}
            </div>
          </div>

          {showStatusBadge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Servicio activo
            </span>
          )}
        </div>

        {/* Buscador */}
        <form onSubmit={onSubmit} className="space-y-2">
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 dark:text-white/85"
          >
            {inputLabel}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
              <input
                id={inputId}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                inputMode={inputMode}
                maxLength={maxLength}
                autoComplete="off"
                className={`h-12 w-full rounded-xl border border-slate-400/70 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 hover:border-slate-500 focus:border-[#C1374A] focus:bg-white focus:ring-4 focus:ring-[#C1374A]/15 dark:border-white/25 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-white/35 dark:hover:border-white/40 dark:focus:border-[#FF5A6B] dark:focus:bg-slate-900 dark:focus:ring-[#FF5A6B]/20 ${
                  uppercase ? "uppercase" : ""
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#C1374A] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9F2436] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading ? loadingLabel : buttonLabel}
            </button>
          </div>

          {helperText && (
            <p className="text-xs text-slate-500 dark:text-white/60">{helperText}</p>
          )}
        </form>
      </div>
    </section>
  );
}