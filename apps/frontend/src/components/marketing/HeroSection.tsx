"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

// Agrega o quita rutas. Con [] solo se usan las imágenes.
const heroVideos: string[] = [
  "/images/Video1.mp4",
  "/images/Video2.mp4",
  "/images/Video3.mp4",
];

const trustPoints = [
  "Paquetería y carga con cobertura nacional e internacional",
  "Cotización y guías con las principales paqueterías en un solo lugar",
  "Seguimiento personalizado de punta a punta",
];

const metrics = [
  { value: "15+", label: "Años de experiencia" },
  { value: "Nac. e Intl.", label: "Cobertura operativa" },
  { value: "B2B", label: "Enfoque corporativo" },
  { value: "24/7", label: "Trazabilidad" },
];

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoIndex, setVideoIndex] = useState(0);
  const [useVideo, setUseVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (heroVideos.length === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = !!conn?.saveData;
    setUseVideo(!reduceMotion && !saveData);
  }, []);

  function handleEnded() {
    setVideoReady(false);
    setVideoIndex((i) => (i + 1) % heroVideos.length);
  }

  useEffect(() => {
    if (!useVideo) return;
    const v = videoRef.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => setUseVideo(false));
  }, [videoIndex, useVideo]);

  function scrollToServices() {
    document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/imageHero13.jpg"
          alt="Operación logística de carga Global Pack Center"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_35%] md:hidden"
        />
        <Image
          src="/images/imageHero12.jpg"
          alt="Operación logística de paquetería y carga Global Pack Center"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center md:block"
        />

        {useVideo && (
          <video
            ref={videoRef}
            key={heroVideos[videoIndex]}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            onEnded={handleEnded}
            onError={() => setUseVideo(false)}
            aria-hidden="true"
          >
            <source src={heroVideos[videoIndex]} type="video/mp4" />
          </video>
        )}
      </div>

      <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(2,6,23,0.80)_0%,rgba(2,6,23,0.55)_50%,rgba(2,6,23,0.30)_100%)]" />

      <div className="mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-center px-4 pb-44 pt-12 sm:px-6 md:pb-48 lg:px-8">
        <p className="inline-flex w-fit items-center rounded-full border border-white/30 bg-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md sm:text-xs">
          <span className="bg-gradient-to-r from-[#FF5A6B] via-[#FF3D53] to-[#C9CED6] bg-clip-text text-transparent">
            Global Pack Center
          </span>
          <span className="ml-1 text-white/90">· Paquetería y carga</span>
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.28)] sm:text-5xl lg:text-6xl">
          Envía y mueve tu carga{" "}
          <span className="text-[#FF5A6B]">con control, rapidez y el mejor costo.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          Soluciones de paquetería y logística B2B a la medida: cotiza, genera guías y da seguimiento a
          tus envíos nacionales e internacionales desde una sola plataforma.
        </p>

        <ul className="mt-6 space-y-2">
          {trustPoints.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-white/95 sm:text-base">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5A6B]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[var(--primary-dark)]"
          >
            Solicitar asesoría
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={scrollToServices}
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Ver servicios
          </button>
        </div>

        {useVideo && heroVideos.length > 1 && (
          <div className="mt-8 flex items-center gap-2" aria-hidden="true">
            {heroVideos.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === videoIndex ? "w-8 bg-white" : "w-3 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra de métricas integrada */}
      <div className="absolute inset-x-0 bottom-6 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-200/90 shadow-[0_14px_34px_rgba(15,23,42,0.20)] md:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white px-4 py-5 text-center text-slate-900 md:py-6">
                <p className="text-xl font-extrabold text-[var(--primary)] md:text-2xl">{m.value}</p>
                <p className="mt-1 text-xs text-slate-600 md:text-sm">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}