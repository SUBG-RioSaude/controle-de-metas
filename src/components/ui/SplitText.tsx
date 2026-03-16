"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  tag?: keyof React.JSX.IntrinsicElements;
  rootMargin?: string;
}

export function SplitText({
  text,
  className = "",
  delay = 40,
  duration = 0.7,
  tag: Tag = "span",
  rootMargin = "-30px",
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: rootMargin as `${number}px` });

  const chars = text.split("");

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{
            duration,
            delay: i * (delay / 1000),
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </Tag>
  );
}
