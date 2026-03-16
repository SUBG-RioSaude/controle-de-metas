"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("hero");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setTimeout(
                  () => window.dispatchEvent(new Event("backtotop")),
                  900,
                );
              }}
              aria-label="Voltar ao topo"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="fixed bottom-8 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-[#42b9eb]/10 border border-[#42b9eb]/30 text-[#42b9eb] backdrop-blur-sm hover:bg-[#42b9eb] hover:text-[#13335a] transition-colors duration-200 shadow-[0_0_20px_rgba(66,185,235,0.15)]"
            >
              <ArrowUp size={16} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="bg-[#13335a] border-white/10 text-white text-xs"
          >
            Voltar ao topo
          </TooltipContent>
        </Tooltip>
      )}
    </AnimatePresence>
  );
}
