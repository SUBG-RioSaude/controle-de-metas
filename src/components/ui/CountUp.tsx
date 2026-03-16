"use client";

import { useRef, useEffect } from "react";
import { useInView, useSpring, useTransform, motionValue, animate } from "framer-motion";

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  from = 0,
  to,
  duration = 1.4,
  delay = 0,
  className = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const mv = motionValue(from);
  const spring = useSpring(mv, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      animate(mv, to, { duration, ease: "easeOut" });
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [isInView, mv, to, duration, delay]);

  useEffect(() => {
    if (!ref.current) return;
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v + suffix;
    });
    return unsubscribe;
  }, [display, suffix]);

  return (
    <span
      ref={ref}
      className={`tabular-nums ${className}`}
      aria-label={`${to}${suffix}`}
    >
      {from.toFixed(decimals)}{suffix}
    </span>
  );
}
