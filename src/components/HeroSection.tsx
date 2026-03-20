"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, LayoutList, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { etapas, planos } from "@/lib/mock-data";
import { getSetores } from "@/lib/metas-api";
import { SplitText } from "@/components/ui/SplitText";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";
import Image from "next/image";
import { CardContainer, CardBody, CardItem } from "@/components/ui/ThreeDCard";
import SpotlightCard from "@/components/SpotlightCard";

const stats = (() => {
  const total = etapas.length;
  const concluidas = etapas.filter((e) => e.status === "Concluída").length;
  const emAndamento = etapas.filter((e) => e.status === "Em Andamento").length;
  const docs = etapas.filter((e) => e.status === "Documento Gerado").length;
  const pct = Math.round((concluidas / total) * 100);
  return { total, concluidas, emAndamento, docs, planos: planos.length, pct };
})();

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

  // Duplica para loop infinito contínuo (anima de 0% → -50%)
  const labels = setores?.map((s) => s.nome) ?? AREAS_FALLBACK;
  const carousel = [...labels, ...labels];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden py-28"
    >
      {/* ── Aurora blobs ────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blob 1 — cyan grande, canto superior esquerdo */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "aurora-1 18s ease-in-out infinite",
          }}
        />
        {/* Blob 2 — azul médio, centro-direita */}
        <div
          className="absolute top-[10%] right-[0%] w-[55%] h-[55%] rounded-full opacity-[0.14]"
          style={{
            background: "radial-gradient(circle, #2a688f 0%, transparent 70%)",
            filter: "blur(90px)",
            animation: "aurora-2 22s ease-in-out infinite",
          }}
        />
        {/* Blob 3 — cyan claro, centro-baixo */}
        <div
          className="absolute bottom-[0%] left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.10]"
          style={{
            background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)",
            filter: "blur(100px)",
            animation: "aurora-3 26s ease-in-out infinite",
          }}
        />
        {/* Blob 4 — azul escuro, canto inferior direito */}
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
            opacity: [opacity, opacity * 1.5, opacity]
          }}
          transition={{ 
            duration: 15 + (i % 5) * 5, 
            repeat: Infinity, 
            ease: "easeInOut"
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
              <motion.span
                initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight tracking-tight bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] bg-clip-text text-transparent"
              >
                Metas
              </motion.span>
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
              Secretaria Municipal de Saúde · SUBG · TCMRio 2025
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
              <CardBody className="w-full bg-white/[0.06]  border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-5 flex flex-col gap-4">

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

                {/* Card Progresso — z médio */}
                <CardItem translateZ={40} className="w-full">
                  <SpotlightCard
                    spotlightColor="rgba(66, 185, 235, 0.18)"
                    className="bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#42b9eb] animate-pulse" />
                        <span className="text-white/40 text-xs uppercase tracking-widest font-medium">Progresso Geral</span>
                      </div>
                      <TrendingUp size={15} className="text-[#42b9eb]" />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-4xl font-display font-bold text-white leading-none">{stats.pct}%</span>
                        <p className="text-white/30 text-xs mt-1">{stats.concluidas} de {stats.total} etapas</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
                          <span>0%</span>
                          <span className="text-[#42b9eb] font-medium">{stats.pct}%</span>
                          <span>100%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#42b9eb] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.pct}%` }}
                            transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-white/30 text-[10px] mt-1.5">Plano de Ação 2025</p>
                      </div>
                    </div>
                  </SpotlightCard>
                </CardItem>

                {/* Card Stats — z alto */}
                <CardItem translateZ={60} className="w-full">
                  <SpotlightCard
                    spotlightColor="rgba(66, 185, 235, 0.12)"
                    className="bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-4"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: <LayoutList size={13} className="text-white/50" />,     value: stats.planos,      label: "Planos"     },
                        { icon: <CheckCircle2 size={13} className="text-emerald-400" />, value: stats.concluidas,  label: "Concluídas" },
                        { icon: <Clock3 size={13} className="text-yellow-400" />,        value: stats.emAndamento, label: "Andamento"  },
                        { icon: <FileCheck2 size={13} className="text-[#42b9eb]" />,     value: stats.docs,        label: "Docs"       },
                      ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5 border border-white/[0.08]">
                          {s.icon}
                          <span className="text-white font-bold text-lg leading-none">{s.value}</span>
                          <span className="text-white/30 text-[10px]">{s.label}</span>
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
