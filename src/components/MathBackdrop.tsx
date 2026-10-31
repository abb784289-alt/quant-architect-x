import { motion, useReducedMotion } from "framer-motion";

const SYMBOLS = ["π", "√x", "∑", "x²", "∞", "Δ", "÷", "%", "θ", "∫", "≈", "a/b"];

/** Animated math-identity backdrop behind the professor portrait. */
export function MathBackdrop() {
  const reduce = useReducedMotion();
  const spin = (dur: number, dir = 1) =>
    reduce ? {} : { animate: { rotate: 360 * dir }, transition: { duration: dur, repeat: Infinity, ease: "linear" as const } };

  return (
    <div aria-hidden className="pointer-events-none absolute -inset-10 -z-0 select-none">
      {/* graph-paper grid */}
      <div
        className="absolute inset-6 rounded-[2.5rem] opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-gold) 1px, transparent 1px), linear-gradient(90deg, var(--color-gold) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
          opacity: 0.18,
        }}
      />
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
        {/* outer dashed protractor ring */}
        <motion.g style={{ originX: "200px", originY: "200px" }} {...spin(60)}>
          <circle cx="200" cy="200" r="190" fill="none" stroke="var(--color-gold)" strokeOpacity="0.55" strokeDasharray="2 10" />
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = i % 3 === 0 ? 178 : 184;
            return (
              <line key={i} x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)} x2={200 + 190 * Math.cos(a)} y2={200 + 190 * Math.sin(a)}
                stroke="var(--color-gold)" strokeOpacity="0.5" strokeWidth="1" />
            );
          })}
        </motion.g>
        {/* inner ring with triangle */}
        <motion.g style={{ originX: "200px", originY: "200px" }} {...spin(90, -1)}>
          <circle cx="200" cy="200" r="160" fill="none" stroke="var(--color-teal)" strokeOpacity="0.5" />
          <polygon points="200,40 338.6,280 61.4,280" fill="none" stroke="var(--color-teal)" strokeOpacity="0.25" />
          <circle cx="200" cy="40" r="4" fill="var(--color-gold)" />
        </motion.g>
        {/* sine wave */}
        <motion.path
          d="M -10 330 Q 40 290 90 330 T 190 330 T 290 330 T 390 330 T 490 330"
          fill="none" stroke="var(--color-teal)" strokeOpacity="0.45" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: "easeInOut", delay: 0.4 }}
        />
      </svg>
      {/* orbiting symbols */}
      <motion.div className="absolute inset-0" {...spin(80)}>
        {SYMBOLS.map((s, i) => {
          const a = (i / SYMBOLS.length) * Math.PI * 2;
          return (
            <span key={s} className="absolute font-display text-sm font-bold text-gold/70 md:text-base"
              style={{ left: `${50 + 48 * Math.cos(a)}%`, top: `${50 + 48 * Math.sin(a)}%`, transform: "translate(-50%,-50%)" }}>
              <motion.span className="inline-block" {...spin(80, -1)}>{s}</motion.span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}
