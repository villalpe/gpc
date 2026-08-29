"use client";

import { useEffect, useRef } from "react";

type CursorGlowProps = {
  className?: string;
  color?: string; // e.g. "255,90,107"
  size?: number; // px
  strength?: number; // alpha 0-1
};

export function CursorGlow({
  className = "",
  color = "255,90,107",
  size = 320,
  strength = 0.18,
}: CursorGlowProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);

      el.style.transform = `translate(${currentX - size / 2}px, ${currentY - size / 2}px)`;
      raf = requestAnimationFrame(tick);
    };

    const onEnter = () => {
      el.style.opacity = "1";
    };

    const onLeave = () => {
      el.style.opacity = "0";
    };

    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 -z-10 rounded-full blur-3xl transition-opacity duration-500 ${className}`}
      style={{
        width: size,
        height: size,
        opacity: 0,
        background: `radial-gradient(circle, rgba(${color}, ${strength}) 0%, rgba(${color}, 0.06) 35%, rgba(${color}, 0) 70%)`,
      }}
    />
  );
}