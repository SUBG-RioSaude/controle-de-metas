"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { PanoramaSection } from "@/components/PanoramaSection";
import { MarcosSection } from "@/components/MarcosSection";
import { PlanosSection } from "@/components/PlanosSection";
import { AnaliseSection } from "@/components/AnaliseSection";
import { CalendarioSection } from "@/components/CalendarioSection";
import { FooterSection } from "@/components/FooterSection";
import { BackToTop } from "@/components/ui/BackToTop";

const S = "white";

const shapeClass = "pointer-events-none absolute";
const dim = "opacity-[0.07]";
const dimLow = "opacity-[0.05]";

const Landing = () => {
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handler = () => setResetKey((k) => k + 1);
    window.addEventListener("backtotop", handler);
    return () => window.removeEventListener("backtotop", handler);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(66,185,235,0.6) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Glows */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#42b9eb]/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed top-[55%] left-0 w-[500px] h-[500px] rounded-full bg-[#2a688f]/[0.08] blur-3xl pointer-events-none" />
      <div className="fixed top-[85%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#42b9eb]/[0.04] blur-3xl pointer-events-none" />

      {/* ── Geometric shapes ─────────────────────────────────────────── */}

      {/* 5% — cruz, direita */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        className={`${shapeClass} right-[8%] ${dim}`}
        style={{ top: "5%" }}
      >
        <rect x="14" y="2" width="4" height="28" fill={S} rx="1" />
        <rect x="2" y="14" width="28" height="4" fill={S} rx="1" />
      </svg>

      {/* 8% — círculo outline, esquerda */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className={`${shapeClass} left-[7%] ${dimLow}`}
        style={{ top: "8%" }}
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
        />
      </svg>

      {/* 13% — quadrado outline, direita */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className={`${shapeClass} right-[18%] ${dimLow}`}
        style={{ top: "13%" }}
      >
        <rect
          x="3"
          y="3"
          width="30"
          height="30"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
          rx="3"
        />
      </svg>

      {/* 18% — cruz, esquerda */}
      <motion.svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className={`${shapeClass} left-[14%] ${dim}`}
        style={{ top: "18%" }}
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="12" y="2" width="4" height="24" fill={S} rx="1" />
        <rect x="2" y="12" width="24" height="4" fill={S} rx="1" />
      </motion.svg>

      {/* 22% — bola sólida pequena, direita */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className={`${shapeClass} right-[5%] ${dim}`}
        style={{ top: "22%" }}
      >
        <circle cx="6" cy="6" r="5" fill={S} />
      </svg>

      {/* 26% — quadrado sólido, esquerda */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className={`${shapeClass} left-[4%] ${dim}`}
        style={{ top: "26%" }}
      >
        <rect x="1" y="1" width="12" height="12" fill={S} rx="2" />
      </svg>

      {/* 31% — círculo outline, direita */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        className={`${shapeClass} right-[10%] ${dimLow}`}
        style={{ top: "31%" }}
      >
        <circle
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
        />
      </svg>

      {/* 36% — cruz grande, esquerda */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className={`${shapeClass} left-[9%] ${dim}`}
        style={{ top: "36%" }}
      >
        <rect x="20" y="2" width="4" height="40" fill={S} rx="1" />
        <rect x="2" y="20" width="40" height="4" fill={S} rx="1" />
      </svg>

      {/* 41% — bola sólida, direita */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className={`${shapeClass} right-[3%] ${dim}`}
        style={{ top: "41%" }}
      >
        <circle cx="5" cy="5" r="4" fill={S} />
      </svg>

      {/* 45% — quadrado outline, centro-direita */}
      <motion.svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        className={`${shapeClass} right-[22%] ${dimLow}`}
        style={{ top: "45%" }}
        animate={{ rotate: [0, 45, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect
          x="3"
          y="3"
          width="32"
          height="32"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
          rx="2"
        />
      </motion.svg>

      {/* 50% — cruz pequena, esquerda */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={`${shapeClass} left-[3%] ${dim}`}
        style={{ top: "50%" }}
      >
        <rect x="10" y="2" width="4" height="20" fill={S} rx="1" />
        <rect x="2" y="10" width="20" height="4" fill={S} rx="1" />
      </svg>

      {/* 55% — círculo outline grande, direita */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        className={`${shapeClass} right-[6%] ${dimLow}`}
        style={{ top: "55%" }}
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
        />
      </svg>

      {/* 60% — quadrado sólido, esquerda */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className={`${shapeClass} left-[16%] ${dim}`}
        style={{ top: "60%" }}
      >
        <rect x="1" y="1" width="8" height="8" fill={S} rx="1.5" />
      </svg>

      {/* 65% — cruz, direita */}
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className={`${shapeClass} right-[14%] ${dim}`}
        style={{ top: "65%" }}
        animate={{ rotate: [0, -90, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="16" y="2" width="4" height="32" fill={S} rx="1" />
        <rect x="2" y="16" width="32" height="4" fill={S} rx="1" />
      </motion.svg>

      {/* 70% — bola sólida, esquerda */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className={`${shapeClass} left-[6%] ${dim}`}
        style={{ top: "70%" }}
      >
        <circle cx="8" cy="8" r="7" fill={S} />
      </svg>

      {/* 75% — quadrado outline, centro */}
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        className={`${shapeClass} left-[48%] ${dimLow}`}
        style={{ top: "75%" }}
      >
        <rect
          x="2"
          y="2"
          width="26"
          height="26"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
          rx="2"
        />
      </svg>

      {/* 80% — cruz, direita */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className={`${shapeClass} right-[4%] ${dim}`}
        style={{ top: "80%" }}
      >
        <rect x="12" y="2" width="4" height="24" fill={S} rx="1" />
        <rect x="2" y="12" width="24" height="4" fill={S} rx="1" />
      </svg>

      {/* 85% — círculo outline, esquerda */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className={`${shapeClass} left-[11%] ${dimLow}`}
        style={{ top: "85%" }}
      >
        <circle
          cx="22"
          cy="22"
          r="19"
          fill="none"
          stroke={S}
          strokeWidth="1.5"
        />
      </svg>

      {/* 90% — bola sólida, direita */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className={`${shapeClass} right-[20%] ${dim}`}
        style={{ top: "90%" }}
      >
        <circle cx="5" cy="5" r="4" fill={S} />
      </svg>

      {/* 94% — quadrado sólido, esquerda */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className={`${shapeClass} left-[5%] ${dim}`}
        style={{ top: "94%" }}
      >
        <rect x="1" y="1" width="10" height="10" fill={S} rx="1.5" />
      </svg>

      {/* ── End geometric shapes ─────────────────────────────────────── */}

      <BackToTop />
      <Navbar />
      <div key={resetKey}>
        <HeroSection />
        <PanoramaSection />
        <MarcosSection />
        <PlanosSection />
        <AnaliseSection />
        <CalendarioSection />
        <FooterSection />
      </div>
    </div>
  );
};

export default Landing;
