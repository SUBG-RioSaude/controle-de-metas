"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { planos, etapas } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";
import { AnimatedCounter } from "./AnimatedCounter";
import { ExternalLink, ChevronRight } from "lucide-react";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";

export function PlanosSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const selectedPlan = planos.find((p) => p.id === selected);
  const planEtapas = selected ? etapas.filter((e) => e.plan_id === selected) : [];
  const completed = planEtapas.filter((e) => e.status === "Concluída" || e.status === "Documento Gerado").length;
  const pct = planEtapas.length > 0 ? Math.round((completed / planEtapas.length) * 100) : 0;

  return (
    <section id="planos" className="py-32 relative">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3 block">Detalhamento</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Planos de Ação
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg">
            Selecione um plano para visualizar todas as etapas, status e documentos comprobatórios.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {planos.map((plan, i) => {
            const pe = etapas.filter((e) => e.plan_id === plan.id);
            const pc = pe.filter((e) => e.status === "Concluída" || e.status === "Documento Gerado").length;
            const pp = pe.length > 0 ? Math.round((pc / pe.length) * 100) : 0;
            const isSelected = selected === plan.id;

            return (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(isSelected ? null : plan.id)}
                className={`glass-panel p-6 text-left transition-all duration-300 group ${
                  isSelected
                    ? "border-primary/50 shadow-[0_0_30px_hsl(189_100%_44%/0.1)]"
                    : "hover:border-border/60"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-xl text-primary">{plan.code}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isSelected ? "rotate-90 text-primary" : "group-hover:translate-x-1"}`} />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{plan.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{plan.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{mounted ? `${pe.length} etapas` : "-- etapas"}</span>
                  <span className="text-primary font-semibold">{mounted ? `${pp}%` : "--%"}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: mounted ? `${pp}%` : 0 }} />
                </div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {selectedPlan && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="glass-panel p-8 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="shrink-0 bg-primary/10 border border-primary/30 rounded-2xl px-6 py-4 font-display font-bold text-3xl text-primary text-center">
                    {selectedPlan.code}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-2xl text-foreground mb-1">{selectedPlan.title}</h3>
                    <p className="text-muted-foreground">{selectedPlan.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <AnimatedCounter value={completed} className="text-3xl text-primary" />
                      <span className="text-muted-foreground text-lg">/</span>
                      <AnimatedCounter value={planEtapas.length} className="text-3xl text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">etapas • {pct}% concluído</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        {["Etapa", "Descritivo", "Tema", "Área", "Prazo", "Status", "Doc.", "Link"].map((h) => (
                          <th key={h} className="text-left px-5 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {planEtapas.map((etapa, i) => (
                        <motion.tr
                          key={etapa.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`border-b border-border/20 hover:bg-accent/20 transition-colors ${i % 2 === 0 ? "bg-card/20" : ""}`}
                        >
                          <td className="px-5 py-4 font-display font-semibold text-primary">E{etapa.step_number}</td>
                          <td className="px-5 py-4 text-foreground max-w-[280px]">{etapa.description}</td>
                          <td className="px-5 py-4 text-muted-foreground text-xs">{etapa.tema}</td>
                          <td className="px-5 py-4 text-muted-foreground">{etapa.area}</td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{etapa.prazo}</td>
                          <td className="px-5 py-4"><StatusBadge status={etapa.status} /></td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">{etapa.documento_comprobatorio || "—"}</td>
                          <td className="px-5 py-4">
                            {etapa.drive_link ? (
                              <a href={etapa.drive_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : <span className="text-muted-foreground/40">—</span>}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ScrollIndicator href="#analise" />
    </section>
  );
}
