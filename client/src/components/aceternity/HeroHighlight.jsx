import { useMemo } from "react";

import { cn } from "../../lib/utils";

function Sparkles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 100}%`,
        top: `${(index * 53) % 100}%`,
        delay: `${(index % 9) * 0.35}s`,
        duration: `${3 + (index % 5) * 0.6}s`,
        size: `${1 + (index % 3)}px`,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="landing-sparkle absolute rounded-full bg-blue-300"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

export function HeroHighlight({ children, className, ...props }) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-[#0b0f19] text-white",
        className
      )}
      {...props}
    >
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="landing-beam landing-beam-one" aria-hidden="true" />
      <div className="landing-beam landing-beam-two" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
      <Sparkles />
      <div className="relative">{children}</div>
    </section>
  );
}
