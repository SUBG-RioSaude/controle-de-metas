"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Clock3, CalendarClock, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMarcos } from "@/lib/metas-api";
import type { ApiMarco } from "@/lib/types";
import SpotlightCard from "@/components/SpotlightCard";
import { SplitText } from "@/components/ui/SplitText";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CARD_W = 220;
const TODAY  = new Date();
type MarcoStatus = "Concluído" | "Em Andamento" | "Próximo";

function getMarcoStatus(isoDate: string): MarcoStatus {
  const diff = (new Date(isoDate).getTime() - TODAY.getTime()) / 86400000;
  if (diff < -1) return "Concluído";
  if (diff <= 1)  return "Em Andamento";
  return "Próximo";
}

function getDaysUntil(isoDate: string) {
  return Math.ceil((new Date(isoDate).getTime() - TODAY.getTime()) / 86400000);
}

function formatPrazo(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const STATUS_CONFIG: Record<MarcoStatus, { color: string; bgColor: string; dotBorder: string; Icon: LucideIcon }> = {
  Concluído:      { color: "text-emerald-400", bgColor: "bg-emerald-400/10 border-emerald-400/20", dotBorder: "border-emerald-400",  Icon: CheckCircle2  },
  "Em Andamento": { color: "text-yellow-300",  bgColor: "bg-yellow-300/10 border-yellow-300/20",  dotBorder: "border-yellow-300",   Icon: Clock3        },
  Próximo:        { color: "text-[#42b9eb]",   bgColor: "bg-[#42b9eb]/10 border-[#42b9eb]/20",   dotBorder: "border-[#42b9eb]",   Icon: CalendarClock },
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function MarcoCard({ marco, index, isAbove }: { marco: ApiMarco; index: number; isAbove: boolean }) {
  const status    = getMarcoStatus(marco.prazo);
  const { color, bgColor, Icon } = STATUS_CONFIG[status];
  const daysUntil = getDaysUntil(marco.prazo);

  return (
    <motion.div
      initial={{ opacity: 0, y: isAbove ? -16 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <SpotlightCard
        spotlightColor="rgba(66, 185, 235, 0.15)"
        className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-5 h-full flex flex-col gap-3"
      >
        <span className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${bgColor} ${color}`}>
          <Icon className="w-3 h-3 shrink-0" />
          {status}
        </span>

        <p className="font-display font-semibold text-white text-sm leading-snug flex-1">
          {marco.etapa}
        </p>

        <div className="h-px bg-white/[0.06]" />

        <p className="text-[11px] text-white/40 font-mono">{formatPrazo(marco.prazo)}</p>

        <div className="flex flex-wrap gap-1.5">
          {marco.responsaveis.map((r, i) => (
            <span key={`${r}-${i}`} className="text-[10px] text-white/50 bg-white/[0.05] border border-white/[0.08] rounded-md px-2 py-0.5">
              {r}
            </span>
          ))}
        </div>

        {status === "Próximo" && (
          <p className="text-[11px] text-white/30 pt-1.5 border-t border-white/[0.06]">
            Em <span className="text-[#42b9eb] font-bold tabular-nums">{daysUntil}</span> dias
          </p>
        )}
      </SpotlightCard>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Timeline horizontal — sem scroll, colunas dividem o espaço igualmente
// ---------------------------------------------------------------------------

function Timeline({ marcos }: { marcos: ApiMarco[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(trackRef, { once: true, amount: 0 });
  const cols = marcos.length;
  const grid = { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "12px" };

  return (
    <div className="w-full">

      {/* Cards acima — posições pares */}
      <div style={grid}>
        {marcos.map((marco, i) => (
          <div key={marco.id} className="flex flex-col justify-end" style={{ minHeight: 220 }}>
            {i % 2 === 0 && <MarcoCard marco={marco} index={i} isAbove />}
          </div>
        ))}
      </div>

      {/* Conectores superiores */}
      <div style={grid}>
        {marcos.map((marco, i) => (
          <div key={marco.id} className="flex justify-center" style={{ height: 24 }}>
            {i % 2 === 0 && (
              <motion.div
                className="w-px bg-gradient-to-b from-white/25 to-white/[0.05] h-full"
                initial={{ scaleY: 0 }} style={{ originY: 0 } as React.CSSProperties}
                whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Trilha + nós */}
      <div ref={trackRef} className="relative py-1" style={grid}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.07]" style={{ gridColumn: `1 / -1` }} />
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#42b9eb]/60 via-[#42b9eb] to-[#42b9eb]"
          initial={{ width: 0 }}
          animate={isInView ? { width: "100%" } : {}}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
        />
        {marcos.map((marco, i) => {
          const status = getMarcoStatus(marco.prazo);
          const { color, dotBorder, Icon } = STATUS_CONFIG[status];
          return (
            <div key={marco.id} className="flex justify-center relative z-10">
              <motion.div
                className={`relative w-9 h-9 rounded-full border-2 ${dotBorder} bg-[#0d2540] flex items-center justify-center`}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <Icon className={`w-3.5 h-3.5 ${color}`} />
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

      {/* Conectores inferiores */}
      <div style={grid}>
        {marcos.map((marco, i) => (
          <div key={marco.id} className="flex justify-center" style={{ height: 24 }}>
            {i % 2 !== 0 && (
              <motion.div
                className="w-px bg-gradient-to-b from-white/[0.05] to-white/25 h-full"
                initial={{ scaleY: 0 }} style={{ originY: 1 } as React.CSSProperties}
                whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Cards abaixo — posições ímpares */}
      <div style={grid}>
        {marcos.map((marco, i) => (
          <div key={marco.id} className="flex flex-col justify-start" style={{ minHeight: 220 }}>
            {i % 2 !== 0 && <MarcoCard marco={marco} index={i} isAbove={false} />}
          </div>
        ))}
      </div>

      {/* Numeração */}
      <div style={{ ...grid, marginTop: 8 }}>
        {marcos.map((marco, i) => (
          <div key={marco.id} className="flex justify-center">
            <motion.span
              className="text-[10px] font-mono text-white/20 tabular-nums"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 + 0.8 }}
            >
              {String(i + 1).padStart(2, "0")}
            </motion.span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// MarcosSection
// ---------------------------------------------------------------------------

export function MarcosSection() {
  const { data: marcos = [], isLoading } = useQuery({
    queryKey: ["marcos"],
    queryFn: getMarcos,
  });

  const statusCounts: Record<MarcoStatus, number> = { Concluído: 0, "Em Andamento": 0, Próximo: 0 };
  marcos.forEach((m) => { statusCounts[getMarcoStatus(m.prazo)]++; });

  const chipConfig = [
    { status: "Concluído"    as MarcoStatus, label: "Concluídos"   },
    { status: "Em Andamento" as MarcoStatus, label: "Em Andamento" },
    { status: "Próximo"      as MarcoStatus, label: "Próximos"     },
  ];

  return (
    <section id="marcos" className="py-32 relative">
      <div className="section-container relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <span className="text-xs font-medium text-[#42b9eb] uppercase tracking-[0.2em] mb-3 block">
            Linha do Tempo
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            <SplitText text="Marcos do Processo" />
          </h2>
          <p className="text-white/40 max-w-lg text-lg">
            Principais entregas e eventos do ciclo de monitoramento de metas junto ao TCMRio e CGM-Rio.
          </p>
        </motion.div>

        {/* Chips */}
        {!isLoading && (
          <div className="flex flex-wrap gap-3 mb-12">
            {chipConfig.map(({ status, label }, i) => {
              const { color, bgColor, Icon } = STATUS_CONFIG[status];
              const count = statusCounts[status];
              if (count === 0) return null;
              return (
                <motion.div key={status}
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${bgColor} ${color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span><span className="font-bold tabular-nums">{count}</span> {label}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Timeline */}
        {isLoading ? (
          <div className="flex gap-4 animate-pulse overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[220px] h-52 bg-white/[0.05] rounded-2xl border border-white/[0.06]" />
            ))}
          </div>
        ) : (
          <Timeline marcos={marcos} />
        )}

      </div>
      <ScrollIndicator href="#temas" />
    </section>
  );
}
