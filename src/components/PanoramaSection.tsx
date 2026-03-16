"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Layers, CheckCircle2, Clock, FileText, RotateCcw, CircleDot } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { etapas, planos } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { CountUp } from "@/components/ui/CountUp";
import SpotlightCard from "@/components/SpotlightCard";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";

// ---------------------------------------------------------------------------
// Tipos e constantes compartilhados
// ---------------------------------------------------------------------------

interface StatsData {
  total: number;
  naoIniciadas: number;
  emAndamento: number;
  concluidas: number;
  docGerado: number;
  aguardando: number;
  pct: number;
}

interface StatusItem {
  label: string;
  key: keyof Omit<StatsData, "pct">;
  icon: LucideIcon;
  iconClass: string;
  spotlightColor: `rgba(${number}, ${number}, ${number}, ${number})`;
}

const CARD_BASE =
  "bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl";

const STATUS_ITEMS: StatusItem[] = [
  {
    label: "Total de Etapas",
    key: "total",
    icon: Layers,
    iconClass: "text-[#42b9eb]",
    spotlightColor: "rgba(66, 185, 235, 0.25)",
  },
  {
    label: "Concluídas",
    key: "concluidas",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    spotlightColor: "rgba(52, 211, 153, 0.2)",
  },
  {
    label: "Em Andamento",
    key: "emAndamento",
    icon: Clock,
    iconClass: "text-yellow-400",
    spotlightColor: "rgba(251, 191, 36, 0.2)",
  },
  {
    label: "Doc. Gerado",
    key: "docGerado",
    icon: FileText,
    iconClass: "text-[#42b9eb]",
    spotlightColor: "rgba(66, 185, 235, 0.2)",
  },
  {
    label: "Não Iniciadas",
    key: "naoIniciadas",
    icon: CircleDot,
    iconClass: "text-white/40",
    spotlightColor: "rgba(148, 163, 184, 0.15)",
  },
  {
    label: "Aguardando",
    key: "aguardando",
    icon: RotateCcw,
    iconClass: "text-orange-400",
    spotlightColor: "rgba(251, 146, 60, 0.2)",
  },
];

// ---------------------------------------------------------------------------
// Variante A — Bento Grid + NumberTicker
// ---------------------------------------------------------------------------

function VariantA({ stats }: { stats: StatsData }) {
  const numAreas = new Set(planos.map((p) => p.area)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card grande: Total + barra de progresso */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`${CARD_BASE} p-8 md:col-span-2 md:row-span-2 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-5 h-5 text-[#42b9eb]" />
            <span className="text-white/40 text-xs uppercase tracking-widest">
              Total de Etapas
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <NumberTicker
              value={stats.total}
              className="text-6xl md:text-7xl text-white font-display font-bold"
            />
            <span className="text-white/30 text-lg font-display">etapas</span>
          </div>
          <p className="text-white/30 text-sm mt-1">
            distribuídas em{" "}
            <span className="text-white/60 font-semibold">{planos.length}</span> planos e{" "}
            <span className="text-white/60 font-semibold">{numAreas}</span> áreas
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-white/40 text-xs uppercase tracking-widest">
              Progresso global
            </span>
            <div className="flex items-baseline gap-1">
              <NumberTicker
                value={stats.pct}
                className="text-3xl text-[#42b9eb] font-display font-bold"
                delay={0.4}
              />
              <span className="text-[#42b9eb] text-lg font-display">%</span>
            </div>
          </div>
          <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${stats.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2">
            concluídas ou com documento gerado
          </p>
        </div>
      </motion.div>

      {/* Cards médios */}
      {STATUS_ITEMS.slice(1, 3).map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
            className={`${CARD_BASE} p-6 flex flex-col justify-between`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-4 h-4 ${item.iconClass}`} />
              <span className="text-white/40 text-xs uppercase tracking-widest">
                {item.label}
              </span>
            </div>
            <NumberTicker
              value={stats[item.key]}
              className="text-4xl text-white font-display font-bold"
              delay={0.2 + i * 0.05}
            />
          </motion.div>
        );
      })}

      {/* Cards inferiores: Doc, Não Iniciadas, Aguardando */}
      {STATUS_ITEMS.slice(3).map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
            className={`${CARD_BASE} p-6 flex flex-col justify-between`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-4 h-4 ${item.iconClass}`} />
              <span className="text-white/40 text-xs uppercase tracking-widest">
                {item.label}
              </span>
            </div>
            <NumberTicker
              value={stats[item.key]}
              className="text-4xl text-white font-display font-bold"
              delay={0.35 + i * 0.05}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variante B — SpotlightCard + Circular Progress + CountUp
// ---------------------------------------------------------------------------

function CircularProgress({ pct }: { pct: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const isInView = useInView(ref, { once: true });

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-48 h-48">
        <svg
          viewBox="0 0 180 180"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
          {/* Trilha de fundo */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Arco de progresso */}
          <motion.circle
            ref={ref}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="url(#progressGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            animate={isInView ? { strokeDashoffset: targetOffset } : {}}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#42b9eb" />
              <stop offset="100%" stopColor="#7dd3f8" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <CountUp
            to={pct}
            duration={1.6}
            delay={0.4}
            decimals={1}
            suffix="%"
            className="text-3xl text-white font-display font-bold"
          />
          <span className="text-white/40 text-xs uppercase tracking-widest mt-1">
            progresso
          </span>
        </div>
      </div>
    </div>
  );
}

function VariantB({ stats }: { stats: StatsData }) {
  return (
    <div className="space-y-6">
      {/* Circular progress centralizado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className={`${CARD_BASE} mx-auto max-w-sm`}
      >
        <CircularProgress pct={stats.pct} />
        <div className="pb-6 text-center">
          <p className="text-white/30 text-xs">
            concluídas ou com documento gerado
          </p>
        </div>
      </motion.div>

      {/* Grid de 6 SpotlightCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATUS_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <SpotlightCard
                spotlightColor={item.spotlightColor}
                className={`${CARD_BASE} p-6 h-full`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-4 h-4 ${item.iconClass}`} />
                  <span className="text-white/40 text-xs uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
                <CountUp
                  to={stats[item.key]}
                  duration={1.4}
                  delay={0.1 + i * 0.08}
                  className="text-4xl text-white font-display font-bold"
                />
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variante C — Bento assimétrico + SpotlightCard + GradientText + DecryptedText
// ---------------------------------------------------------------------------

function VariantC({ stats }: { stats: StatsData }) {
  const numAreas = new Set(planos.map((p) => p.area)).size;

  // Linha superior + meio: 4 cards menores + 1 grande
  const smallItems = STATUS_ITEMS.slice(1, 5); // concluidas, andamento, docGerado, naoIniciadas

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Coluna esquerda: 4 cards menores empilhados em 2x2 */}
      <div className="md:col-span-1 grid grid-cols-2 gap-4">
        {smallItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <SpotlightCard
                spotlightColor="rgba(66, 185, 235, 0.15)"
                className={`${CARD_BASE} p-5 h-full`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-3.5 h-3.5 ${item.iconClass}`} />
                  <span className="text-white/40 text-[10px] uppercase tracking-widest leading-tight">
                    {item.label}
                  </span>
                </div>
                <CountUp
                  to={stats[item.key]}
                  duration={1.4}
                  delay={0.15 + i * 0.07}
                  className="text-3xl text-white font-display font-bold"
                />
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      {/* Card grande à direita: % com GradientText */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="md:col-span-2"
      >
        <SpotlightCard
          spotlightColor="rgba(66, 185, 235, 0.15)"
          className={`${CARD_BASE} p-8 h-full flex flex-col justify-between`}
        >
          <div>
            <span className="text-white/40 text-xs uppercase tracking-widest mb-4 block">
              Progresso Global
            </span>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] bg-clip-text text-transparent font-display font-bold text-7xl md:text-8xl leading-none tabular-nums">
                <CountUp
                  to={stats.pct}
                  duration={1.6}
                  delay={0.3}
                  decimals={1}
                  className="bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] bg-clip-text text-transparent font-display font-bold text-7xl md:text-8xl"
                />
              </span>
              <span className="bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] bg-clip-text text-transparent font-display font-bold text-3xl">
                %
              </span>
            </div>
            <p className="text-white/30 text-sm">
              das etapas concluídas ou com documento gerado
            </p>
          </div>

          <div className="mt-8">
            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-[#42b9eb] to-[#7dd3f8] rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${mounted ? stats.pct : 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
              />
            </div>

            {/* Linha inferior com resumo */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
              {[
                { label: "Planos", value: planos.length, icon: Layers },
                { label: "Áreas", value: numAreas, icon: CircleDot },
                {
                  label: "Aguardando",
                  value: stats.aguardando,
                  icon: RotateCcw,
                },
              ].map((summary, i) => {
                const SIcon = summary.icon;
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <SIcon className="w-3 h-3 text-white/30" />
                      <span className="text-white/40 text-[10px] uppercase tracking-widest">
                        {summary.label}
                      </span>
                    </div>
                    <span className="text-white font-display font-bold text-2xl tabular-nums">
                      {summary.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PanoramaSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const stats = useMemo<StatsData>(() => {
    const total = etapas.length;
    const naoIniciadas = etapas.filter((e) => e.status === "Não Iniciada").length;
    const emAndamento = etapas.filter((e) => e.status === "Em Andamento").length;
    const concluidas = etapas.filter((e) => e.status === "Concluída").length;
    const docGerado = etapas.filter((e) => e.status === "Documento Gerado").length;
    const aguardando = etapas.filter(
      (e) => e.status === "Aguardando retorno da área"
    ).length;
    const pct =
      total > 0
        ? Math.round(((concluidas + docGerado) / total) * 100 * 10) / 10
        : 0;
    return { total, naoIniciadas, emAndamento, concluidas, docGerado, aguardando, pct };
  }, []);

  return (
    <section id="panorama" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh-bg" />
      <div className="section-container relative z-10">
        {/* Header da seção */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="text-xs font-medium text-[#42b9eb] uppercase tracking-[0.2em] mb-3 block">
            Panorama Geral
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            <TypewriterEffect
              words={[
                { text: "Visão" },
                { text: "em" },
                { text: "Números", className: "text-[#42b9eb]" },
              ]}
            />
          </h2>
          <p className="text-white/40 max-w-lg text-lg">
            {planos.length} planos de ação monitorados com {etapas.length} etapas
            em acompanhamento contínuo.
          </p>
        </motion.div>

        {/* Tabs de comparação */}
        <Tabs defaultValue="a">
          <TabsList className="mb-8 bg-white/[0.06] border border-white/10 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="a"
              className="data-[state=active]:bg-[#42b9eb] data-[state=active]:text-[#13335a] text-white/60 rounded-lg font-display font-semibold px-6 py-2 transition-all"
            >
              Opção A
            </TabsTrigger>
            <TabsTrigger
              value="b"
              className="data-[state=active]:bg-[#42b9eb] data-[state=active]:text-[#13335a] text-white/60 rounded-lg font-display font-semibold px-6 py-2 transition-all"
            >
              Opção B
            </TabsTrigger>
            <TabsTrigger
              value="c"
              className="data-[state=active]:bg-[#42b9eb] data-[state=active]:text-[#13335a] text-white/60 rounded-lg font-display font-semibold px-6 py-2 transition-all"
            >
              Opção C
            </TabsTrigger>
          </TabsList>

          <TabsContent value="a">
            <VariantA stats={stats} />
          </TabsContent>
          <TabsContent value="b">
            <VariantB stats={stats} />
          </TabsContent>
          <TabsContent value="c">
            <VariantC stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
      <ScrollIndicator href="#planos" />
    </section>
  );
}
