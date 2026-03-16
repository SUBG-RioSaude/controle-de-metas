"use client";

import { motion } from "framer-motion";

interface ScrollIndicatorProps {
  href: string;
  delay?: number;
}

export function ScrollIndicator({ href, delay = 0.8 }: ScrollIndicatorProps) {
  return (
    <motion.a
      href={href}
      aria-label="Próxima seção"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group"
    >
      <div className="relative w-6 h-10 rounded-full border-2 border-white/20 group-hover:border-[#42b9eb]/60 transition-colors duration-300 flex justify-center pt-2">
        <motion.span
          className="w-1 h-1.5 rounded-full bg-[#42b9eb]"
          animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <span className="text-white/25 text-[10px] uppercase tracking-[0.2em] font-medium group-hover:text-white/50 transition-colors duration-300">
        scroll
      </span>
    </motion.a>
  );
}
