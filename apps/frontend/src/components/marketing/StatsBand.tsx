"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/marketing/Reveal";

type Stat = {
  label: string;
  value: number;
  suffix?: string;
};

const stats: Stat[] = [
  { label: "Envíos gestionados", value: 120, suffix: "k+" },
  { label: "Sucursales conectadas", value: 25, suffix: "+" },
  { label: "Entregas a tiempo", value: 98, suffix: "%" },
  { label: "Soporte operativo", value: 24, suffix: "/7" },
];

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setValue(to);
      return;
    }

    const duration = 1400;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      <span className="text-[#FF5A6B]">{suffix}</span>
    </span>
  );
}

export function StatsBand() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,#0b1224_0%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,90,107,0.16),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_80%,rgba(124,143,184,0.14),transparent_38%)]" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <Reveal y={14}>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Resultados que respaldan nuestra operación
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm md:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delayMs={i * 80} y={12}>
              <article
                className={`h-full px-4 py-8 text-center md:py-10 ${
                  i % 2 === 1 ? "" : "border-r border-white/10"
                } ${i < 2 ? "border-b border-white/10 md:border-b-0" : ""} ${
                  i < 3 ? "md:border-r" : "md:border-r-0"
                } md:border-white/10`}
              >
                <p className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/65 md:text-sm">
                  {stat.label}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}