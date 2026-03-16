"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";

interface NumberTickerProps {
  value: number;
  className?: string;
  delay?: number;
}

function Digit({ digit, delay }: { digit: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !ref.current) return;

    const el = ref.current;

    const controls = animate(0, digit, {
      duration: 0.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        const rounded = Math.round(latest);
        el.style.transform = `translateY(-${rounded * 10}%)`;
      },
    });

    return () => controls.stop();
  }, [isInView, digit, delay]);

  return (
    <span className="relative inline-block overflow-hidden" style={{ height: "1.2em" }}>
      <span
        ref={ref}
        className="flex flex-col"
        style={{ transform: "translateY(0%)", willChange: "transform" }}
        aria-hidden="true"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="flex items-center justify-center"
            style={{ height: "1.2em", lineHeight: "1.2em" }}
          >
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

export function NumberTicker({ value, className = "", delay = 0 }: NumberTickerProps) {
  const digits = String(Math.abs(Math.round(value))).split("").map(Number);

  return (
    <span
      className={`inline-flex tabular-nums ${className}`}
      aria-label={String(value)}
    >
      {digits.map((digit, index) => (
        <Digit
          key={index}
          digit={digit}
          delay={delay + index * 0.05}
        />
      ))}
    </span>
  );
}
