"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Clock3, CalendarClock } from "lucide-react";
import { marcos, type Marco } from "@/lib/mock-data";
import SpotlightCard from "@/components/SpotlightCard";
import { SplitText } from "@/components/ui/SplitText";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";

// ---------------------------------------------------------------------------
// Status logic — data fixa para evitar hydration mismatch
// ---------------------------------------------------------------------------

const TODAY = new Date("2026-03-16");

type MarcoStatus = "Concluído" | "Em Andamento" | "Próximo";

function getMarcoStatus(isoDate: string): MarcoStatus {
  const diff = new Date(isoDate).getTime() - TODAY.getTime();
  const days = diff / 86400000;
  if (days < -1) return "Concluído";
  if (days <= 1) return "Em Andamento";
  return "Próximo";
}

function getDaysUntil(isoDate: string): number {
  const diff = new Date(isoDate).getTime() - TODAY.getTime();
  return Math.ceil(diff / 86400000);
}

const STATUS_CONFIG: Record<
  MarcoStatus,
  { color: string; bgColor: string; dotColor: string; Icon: React.ElementType }
> = {
  Concluído: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/20",
    dotColor: "bg-emerald-400 border-emerald-400/60",
    Icon: CheckCircle2,
  },
  "Em Andamento": {
    color: "text-yellow-300",
    bgColor: "bg-yellow-300/10 border-yellow-300/20",
    dotColor: "bg-yellow-300 border-yellow-300/60",
    Icon: Clock3,
  },
  Próximo: {
    color: "text-[#42b9eb]",
    bgColor: "bg-[#42b9eb]/10 border-[#42b9eb]/20",
    dotColor: "bg-[#42b9eb]/60 border-[#42b9eb]",
    Icon: CalendarClock,
  },
};

// ---------------------------------------------------------------------------
// Card compacto para a timeline horizontal
// ---------------------------------------------------------------------------

function HorizontalMarcoCard({ marco, index }: { marco: Marco; index: number }) {
  const status = getMarcoStatus(marco.date);
  const { color, bgColor, Icon } = STATUS_CONFIG[status];
  const daysUntil = getDaysUntil(marco.date);
  const isAbove = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: isAbove ? -16 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <SpotlightCard
        spotlightColor="rgba(66, 185, 235, 0.15)"
        className="bg-white/[0.06] border border-white/10 rounded-xl p-4 h-full flex flex-col"
      >
        {/* Icon + badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${bgColor} border shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${bgColor} ${color}`}>
            {status}
          </span>
        </div>

        {/* Title */}
        <p className="font-display font-semibold text-white text-sm leading-snug mb-1">
          {marco.title}
        </p>

        {/* Date */}
        <p className="text-[10px] text-white/40 font-mono mb-3">{marco.dateLabel}</p>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-3" />

        {/* Description */}
        <p className="text-xs text-white/50 leading-relaxed line-clamp-4 flex-1">
          {marco.description}
        </p>

        {/* Em X dias */}
        {status === "Próximo" && (
          <p className="mt-3 text-[10px] text-white/30">
            Em{" "}
            <span className="text-[#42b9eb] font-bold tabular-nums">{daysUntil}</span>{" "}
            dias
          </p>
        )}
      </SpotlightCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MarcosSection
// ---------------------------------------------------------------------------

export function MarcosSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(trackRef, { once: true, amount: 0.6 });

  const statusCounts: Record<MarcoStatus, number> = {
    Concluído: 0,
    "Em Andamento": 0,
    Próximo: 0,
  };
  marcos.forEach((m) => {
    statusCounts[getMarcoStatus(m.date)]++;
  });

  const chipConfig: Array<{ status: MarcoStatus; label: string }> = [
    { status: "Concluído", label: "Concluídos" },
    { status: "Em Andamento", label: "Em Andamento" },
    { status: "Próximo", label: "Próximos" },
  ];

  return (
    <section id="marcos" className="py-32 relative">
      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="text-xs font-medium text-[#42b9eb] uppercase tracking-[0.2em] mb-3 block">
            Linha do Tempo
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            <SplitText text="Marcos do Processo" />
          </h2>
          <p className="text-white/40 max-w-lg text-lg">
            Principais entregas e eventos do ciclo de monitoramento de metas junto ao
            TCMRio e CGM-Rio.
          </p>
        </motion.div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3 mb-14">
          {chipConfig.map(({ status, label }, i) => {
            const { color, bgColor, Icon } = STATUS_CONFIG[status];
            const count = statusCounts[status];
            if (count === 0) return null;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${bgColor} ${color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>
                  <span className="font-bold tabular-nums">{count}</span> {label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Timeline horizontal */}
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
          <div className="min-w-[780px]">

            {/* Linha 1 — cards ACIMA (índices 0, 2, 4) */}
            <div className="flex gap-3">
              {marcos.map((marco, index) => (
                <div key={marco.id} className="flex-1 flex flex-col justify-end" style={{ minHeight: 220 }}>
                  {index % 2 === 0 && <HorizontalMarcoCard marco={marco} index={index} />}
                </div>
              ))}
            </div>

            {/* Linha 2 — conectores superiores (índices pares) */}
            <div className="flex gap-3">
              {marcos.map((_, index) => (
                <div key={index} className="flex-1 flex justify-center" style={{ height: 28 }}>
                  {index % 2 === 0 && (
                    <motion.div
                      className="w-px bg-gradient-to-b from-white/30 to-white/10 h-full"
                      initial={{ scaleY: 0 }}
                      style={{ originY: 0 }}
                      animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.8 }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Linha 3 — trilha + nós */}
            <div ref={trackRef} className="relative flex gap-3 items-center py-1">
              {/* Track de fundo */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.08]" />

              {/* Beam animado */}
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#42b9eb]/60 via-[#42b9eb] to-[#42b9eb]"
                initial={{ width: "0%" }}
                animate={isInView ? { width: "100%" } : {}}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
              />

              {/* Nós */}
              {marcos.map((marco, index) => {
                const status = getMarcoStatus(marco.date);
                const { color, dotColor, Icon } = STATUS_CONFIG[status];

                return (
                  <div key={marco.id} className="flex-1 flex justify-center relative z-10">
                    <motion.div
                      className={`relative w-11 h-11 rounded-full border-2 ${dotColor} bg-[#0d2540] flex items-center justify-center`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={isInView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.4, delay: index * 0.12 + 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      {status === "Em Andamento" && (
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-yellow-300/30"
                          animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Linha 4 — conectores inferiores (índices ímpares) */}
            <div className="flex gap-3">
              {marcos.map((_, index) => (
                <div key={index} className="flex-1 flex justify-center" style={{ height: 28 }}>
                  {index % 2 !== 0 && (
                    <motion.div
                      className="w-px bg-gradient-to-b from-white/10 to-white/30 h-full"
                      initial={{ scaleY: 0 }}
                      style={{ originY: 1 }}
                      animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.8 }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Linha 5 — cards ABAIXO (índices 1, 3) */}
            <div className="flex gap-3">
              {marcos.map((marco, index) => (
                <div key={marco.id} className="flex-1 flex flex-col justify-start" style={{ minHeight: 220 }}>
                  {index % 2 !== 0 && <HorizontalMarcoCard marco={marco} index={index} />}
                </div>
              ))}
            </div>

            {/* Numeração */}
            <div className="flex gap-3 mt-4">
              {marcos.map((_, index) => (
                <div key={index} className="flex-1 flex justify-center">
                  <motion.span
                    className="text-[10px] font-mono text-white/25 tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.1 + 1.2 }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </motion.span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <ScrollIndicator href="#planos" />
    </section>
  );
}
