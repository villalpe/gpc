"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  y?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  y = 26,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setShown(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0) scale(0.985)`,
        filter: shown ? "blur(0px)" : "blur(3px)",
        transitionProperty: "opacity, transform, filter",
        transitionDuration: "800ms",
        transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
        transitionDelay: `${delayMs}ms`,
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}