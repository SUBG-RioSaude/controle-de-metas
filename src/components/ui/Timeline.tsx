"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full" ref={containerRef}>
      <div ref={ref} className="relative">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-16 md:gap-10">
            {/* Left column — sticky date label */}
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              {/* Dot */}
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-[#42b9eb]/60 border border-[#42b9eb] p-1" />
              </div>
              <h3 className="hidden md:block text-sm md:pl-20 md:text-sm font-mono font-medium text-white/50">
                {item.title}
              </h3>
            </div>

            {/* Right column — content */}
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-sm mb-4 text-left font-mono font-medium text-white/50">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Vertical track */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,transparent_0%,rgba(66,185,235,0.15)_10%,rgba(66,185,235,0.15)_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-transparent via-[#42b9eb] to-transparent rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
