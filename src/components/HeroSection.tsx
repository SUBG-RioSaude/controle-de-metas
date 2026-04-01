"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, LayoutList, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { planos } from "@/lib/mock-data";
import { getSetores, getDashboardStats } from "@/lib/metas-api";
import { SplitText } from "@/components/ui/SplitText";
import { FlipWords } from "@/components/ui/FlipWords";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import Image from "next/image";
import { CardContainer, CardBody, CardItem } from "@/components/ui/ThreeDCard";
import SpotlightCard from "@/components/SpotlightCard";

const AREAS_FALLBACK = ["DAF", "RH", "NGMC", "DOP", "TI", "NPC", "SUBG"];


const CROSSES = [
  { size: 28, top: "8%",  left: "4%",   opacity: 0.10 },
  { size: 14, top: "18%", left: "38%",  opacity: 0.07 },
  { size: 20, top: "6%",  left: "70%",  opacity: 0.08 },
  { size: 10, top: "30%", left: "82%",  opacity: 0.11 },
  { size: 32, top: "50%", left: "2%",   opacity: 0.06 },
  { size: 16, top: "62%", left: "48%",  opacity: 0.08 },
  { size: 22, top: "75%", left: "15%",  opacity: 0.07 },
  { size: 12, top: "80%", left: "68%",  opacity: 0.10 },
  { size: 18, top: "88%", left: "90%",  opacity: 0.07 },
  { size: 26, top: "40%", left: "60%",  opacity: 0.06 },
  { size: 10, top: "55%", left: "28%",  opacity: 0.09 },
  { size: 20, top: "92%", left: "42%",  opacity: 0.07 },
];

export function HeroSection() {
  const { data: setores } = useQuery({
    queryKey: ["setores"],
    queryFn: getSetores,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const m = dashboard?.metricas;
  const stats = {
    total:       m?.totalTopicos        ?? 0,
    concluidas:  m?.concluidas         ?? 0,
    emAndamento: m?.emAndamento        ?? 0,
    docs:        m?.documentosUploaded ?? 0,
    planos:      planos.length,
    pct:         m?.percentualConcluidas ?? 0,
  };

  // Duplica para loop infinito contínuo (anima de 0% → -50%)
  const labels = setores?.map((s) => s.nome) ?? AREAS_FALLBACK;

  // Ativa o FlipWords após a animação de entrada da badge terminar (~1.3s)
  const [flipActive, setFlipActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFlipActive(true), 1300);
    return () => clearTimeout(t);
  }, []);
  const carousel = [...labels, ...labels];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden py-28"
    >
      {/* ── Aurora blobs ────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "aurora-1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[10%] right-[0%] w-[55%] h-[55%] rounded-full opacity-[0.14]"
          style={{
            background: "radial-gradient(circle, #2a688f 0%, transparent 70%)",
            filter: "blur(90px)",
            animation: "aurora-2 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.10]"
          style={{
            background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)",
            filter: "blur(100px)",
            animation: "aurora-3 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] rounded-full opacity-[0.20]"
          style={{
            background: "radial-gradient(circle, #1a4a7a 0%, transparent 70%)",
            filter: "blur(70px)",
            animation: "aurora-4 20s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Cruzes decorativas ──────────────────────────────────────── */}
      {CROSSES.map(({ size, top, left, opacity }, i) => (
        <motion.svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className="absolute pointer-events-none"
          style={{ top, left, opacity }}
          aria-hidden
          animate={{
            x: [0, (i % 2 === 0 ? 20 : -20), (i % 3 === 0 ? -15 : 25), 0],
            y: [0, (i % 2 !== 0 ? 25 : -20), (i % 3 !== 0 ? -30 : 15), 0],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1],
            opacity: [opacity, opacity * 1.5, opacity],
          }}
          transition={{
            duration: 15 + (i % 5) * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <rect x="10" y="1" width="4" height="22" fill="white" rx="1" />
          <rect x="1" y="10" width="22" height="4" fill="white" rx="1" />
        </motion.svg>
      ))}

      {/* ── Conteúdo ─────────────────────────────────────────────────── */}
      <div className="section-container w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ─── Left ─────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-6 lg:pl-4">

            {/* Título */}
            <div className="flex flex-col gap-1">
              <SplitText
                text="Controle de"
                tag="h1"
                delay={40}
                duration={0.7}
                rootMargin="0px"
                className="text-5xl lg:text-6xl xl:text-7xl font-display font-semibold leading-tight tracking-tight text-white"
              />
              <div className="flex items-baseline gap-4">
                <motion.span
                  initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight tracking-tight bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] bg-clip-text text-transparent"
                >
                  Metas
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.72, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] text-sm font-display font-bold tracking-wide overflow-hidden"
                  style={{ color: "#0d2a47" }}
                >
                  {flipActive ? (
                    <FlipWords words={["2025", "2026"]} duration={2500} />
                  ) : (
                    <span>2026</span>
                  )}
                </motion.span>
              </div>
            </div>

            {/* Logos */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-6"
            >
              <Image src="/brand/logobranca.png" alt="Prefeitura Rio — Saúde" width={140} height={36} className="object-contain" priority />
              <div className="w-px h-9 bg-white/20 shrink-0" />
              <Image src="/brand/tcmrio-logo.png" alt="TCMRio" width={108} height={22} className="object-contain" />
            </motion.div>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.70 }}
              className="text-white/45 text-sm leading-relaxed"
            >
              Secretaria Municipal de Saúde · SUBG
            </motion.p>

            {/* Botão */}
            <motion.a
              href="#planos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="w-fit inline-flex items-center gap-2 bg-[#42b9eb] text-[#13335a] px-7 py-3.5 rounded-full font-display font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0_0_24px_rgba(66,185,235,0.35)]"
            >
              Ver Planos <ArrowRight size={15} />
            </motion.a>
          </div>

          {/* ─── Right — 3D Card ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-sm lg:max-w-md"
          >
            <CardContainer className="w-full" containerClassName="w-full">
              <CardBody className="w-full bg-white/[0.06] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-5 flex flex-col gap-4">

                {/* Carousel — z base */}
                <CardItem translateZ={15} className="w-full overflow-hidden rounded-xl">
                  <motion.div
                    className="flex gap-2 w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                  >
                    {carousel.map((label, i) => (
                      <span key={i} className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold font-display tracking-wide bg-white/10 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] text-white/70">
                        {label}
                      </span>
                    ))}
                  </motion.div>
                </CardItem>

                {/* Métricas — z alto */}
                <CardItem translateZ={60} className="w-full">
                  <SpotlightCard
                    spotlightColor="rgba(66, 185, 235, 0.12)"
                    className="bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Métricas</span>
                      <TrendingUp size={13} className="text-[#42b9eb]/60" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: <LayoutList size={14} className="text-white/50" />,      value: stats.total,       label: "Total de Metas",       accent: "text-white"        },
                        { icon: <CheckCircle2 size={14} className="text-emerald-400" />, value: stats.concluidas,  label: "Concluídas",           accent: "text-emerald-400"  },
                        { icon: <Clock3 size={14} className="text-yellow-400" />,        value: stats.emAndamento, label: "Objetivos em Andamento", accent: "text-yellow-400"   },
                        { icon: <FileCheck2 size={14} className="text-[#42b9eb]" />,     value: stats.docs,        label: "Docs Enviados",        accent: "text-[#42b9eb]"    },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                          <div className="shrink-0">{s.icon}</div>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-display font-bold text-base leading-none ${s.accent}`}>{s.value}</span>
                            <span className="text-white/35 text-[10px] mt-0.5 truncate">{s.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SpotlightCard>
                </CardItem>

              </CardBody>
            </CardContainer>
          </motion.div>

        </div>
      </div>

      <ScrollIndicator href="#panorama" delay={1.4} />
    </section>
  );
}
