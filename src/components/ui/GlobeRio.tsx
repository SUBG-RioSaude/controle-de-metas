"use client";

import createGlobe from "cobe";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const RIO_LAT = -22.9068;
const RIO_LNG = -43.1729;

const TARGET_PHI = (180 - RIO_LNG) * (Math.PI / 180);
const TARGET_THETA = RIO_LAT * (Math.PI / 180);

export default function GlobeRio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = canvas.offsetWidth || 260;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Inicia levemente deslocado e anima em direção ao Rio
    let currentPhi = TARGET_PHI + 1.2;
    let currentTheta = TARGET_THETA - 0.3;
    let hasSettled = false;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: currentPhi,
      theta: currentTheta,
      dark: 1,
      diffuse: 1.5,
      mapSamples: 20000,
      mapBrightness: 8,
      baseColor: [0.05, 0.15, 0.3],
      markerColor: [0.26, 0.73, 0.92],
      glowColor: [0.26, 0.73, 0.92],
      markers: [{ location: [RIO_LAT, RIO_LNG], size: 0.06 }],
      onRender(state) {
        // Lerp suave em direção ao alvo
        currentPhi += (TARGET_PHI - currentPhi) * 0.04;
        currentTheta += (TARGET_THETA - currentTheta) * 0.04;

        state.phi = currentPhi;
        state.theta = currentTheta;

        // Detecta quando chegou perto o suficiente
        if (
          !hasSettled &&
          Math.abs(currentPhi - TARGET_PHI) < 0.005 &&
          Math.abs(currentTheta - TARGET_THETA) < 0.005
        ) {
          hasSettled = true;
          setSettled(true);
        }
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />

      {/* Pin elegante — aparece após o globo chegar no Rio */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: "44%", left: "50%", x: "-50%", y: "-100%" }}
        initial={{ opacity: 0, y: 8 }}
        animate={settled ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Label */}
        <div className="flex flex-col items-center">
          <div className="mb-1.5 px-2 py-0.5 rounded bg-[#42b9eb]/15 border border-[#42b9eb]/35 backdrop-blur-sm">
            <span className="text-[9px] text-[#42b9eb] font-mono tracking-widest uppercase whitespace-nowrap">
              Rio de Janeiro
            </span>
          </div>

          {/* Linha vertical do pin */}
          <div className="w-px h-4 bg-gradient-to-b from-[#42b9eb]/60 to-[#42b9eb]/20" />

          {/* Dot com pulse */}
          <div className="relative flex items-center justify-center mt-0.5">
            <div className="w-2 h-2 rounded-full bg-[#42b9eb] z-10" />
            <div className="absolute w-2 h-2 rounded-full bg-[#42b9eb] animate-ping opacity-50" />
            <div className="absolute w-5 h-5 rounded-full border border-[#42b9eb]/25 animate-pulse" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
