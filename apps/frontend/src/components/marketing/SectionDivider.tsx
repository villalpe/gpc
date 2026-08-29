type SectionDividerProps = {
  tone?: "dark" | "light";
};

export function SectionDivider({ tone = "dark" }: SectionDividerProps) {
  if (tone === "light") {
    return (
      <div className="relative h-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <div className="absolute inset-x-0 -top-6 h-16 bg-gradient-to-b from-slate-200/60 to-transparent blur-xl" />
      </div>
    );
  }

  return (
    <div className="relative h-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute inset-x-0 -top-6 h-16 bg-gradient-to-b from-white/[0.05] to-transparent blur-xl" />
    </div>
  );
}