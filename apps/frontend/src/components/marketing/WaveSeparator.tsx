type WaveSeparatorProps = {
  /** color de la sección de abajo (la siguiente) */
  nextBg?: string;
  /** voltear ola */
  flip?: boolean;
  /** altura en px */
  height?: number;
  className?: string;
};

export function WaveSeparator({
  nextBg = "#ffffff",
  flip = false,
  height = 64,
  className = "",
}: WaveSeparatorProps) {
  return (
    <div
      className={`relative w-full leading-none ${className}`}
      style={{ height }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`block h-full w-full ${flip ? "rotate-180" : ""}`}
      >
        <path
          fill={nextBg}
          d="M0,64 C180,120 360,0 540,40 C720,80 900,140 1080,92 C1260,44 1350,56 1440,76 L1440,120 L0,120 Z"
        />
      </svg>
    </div>
  );
}