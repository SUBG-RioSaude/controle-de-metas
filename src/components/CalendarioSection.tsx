"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { etapas } from "@/lib/mock-data";
import { Etapa } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { AnimatedCounter } from "./AnimatedCounter";
import { X } from "lucide-react";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = String(i + 1).padStart(2, "0");
  return { label: `2026/${m}`, value: `2026-${m}` };
});
const WEEKDAYS = ["Dom", "Seg", "Ter", "Quar", "Qui", "Sex", "Sáb"];

export function CalendarioSection() {
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthEtapas = useMemo(() => etapas.filter((e) => e.prazo.startsWith(selectedMonth)), [selectedMonth]);

  const statusCounts = useMemo(() => {
    const c = { naoIniciadas: 0, emAndamento: 0, concluidas: 0, docGerado: 0, aguardando: 0 };
    monthEtapas.forEach((e) => {
      if (e.status === "Não Iniciada") c.naoIniciadas++;
      else if (e.status === "Em Andamento") c.emAndamento++;
      else if (e.status === "Concluída") c.concluidas++;
      else if (e.status === "Documento Gerado") c.docGerado++;
      else c.aguardando++;
    });
    return c;
  }, [monthEtapas]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [selectedMonth]);

  const etapasByDay = useMemo(() => {
    const map: Record<number, Etapa[]> = {};
    monthEtapas.forEach((e) => {
      const day = parseInt(e.prazo.split("-")[2]);
      if (!map[day]) map[day] = [];
      map[day].push(e);
    });
    return map;
  }, [monthEtapas]);

  const dayEtapas = selectedDay ? etapasByDay[selectedDay] || [] : [];

  return (
    <section id="calendario" className="py-32 relative">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3 block">Calendário</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Visão Temporal
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg">
            Explore as etapas distribuídas ao longo dos meses de 2026.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <div className="space-y-4">
            <div className="glass-panel p-4 space-y-1">
              {MONTHS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => { setSelectedMonth(m.value); setSelectedDay(null); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedMonth === m.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="glass-panel p-4 space-y-3">
              {[
                { label: "Concluídas", value: statusCounts.concluidas, cls: "text-status-concluida" },
                { label: "Em Andamento", value: statusCounts.emAndamento, cls: "text-status-andamento" },
                { label: "Doc. Gerado", value: statusCounts.docGerado, cls: "text-status-documento" },
                { label: "Não Iniciadas", value: statusCounts.naoIniciadas, cls: "text-status-nao-iniciada" },
                { label: "Aguardando", value: statusCounts.aguardando, cls: "text-status-aguardando" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <AnimatedCounter value={item.value} className={`text-lg ${item.cls}`} />
                </div>
              ))}
            </div>
          </div>

          <motion.div
            key={selectedMonth}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel overflow-hidden"
          >
            <div className="bg-secondary/30 p-5 text-center border-b border-border/30">
              <h3 className="font-display font-bold text-lg text-foreground">
                {selectedMonth.replace("-", "/")}
              </h3>
              <p className="text-sm text-muted-foreground">{monthEtapas.length} etapas no mês</p>
            </div>
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div key={d} className="p-3 text-center text-xs font-bold text-primary/70 uppercase border-b border-border/20">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const dd = day ? etapasByDay[day] : undefined;
                return (
                  <div
                    key={i}
                    onClick={() => day && dd && setSelectedDay(day)}
                    className={`min-h-[72px] p-2 border-b border-r border-border/10 transition-colors ${
                      day && dd ? "cursor-pointer hover:bg-primary/5" : ""
                    } ${!day ? "bg-muted/10" : ""}`}
                  >
                    {day && (
                      <>
                        <span className="text-xs text-muted-foreground">{day}</span>
                        {dd && (
                          <div className="mt-1">
                            <div className="flex gap-0.5 flex-wrap">
                              {dd.slice(0, 3).map((_, j) => (
                                <div key={j} className="w-1.5 h-1.5 rounded-full bg-primary" />
                              ))}
                              {dd.length > 3 && <span className="text-[10px] text-muted-foreground ml-0.5">+{dd.length - 3}</span>}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedDay !== null && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
                onClick={() => setSelectedDay(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg max-h-[80vh] glass-panel z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-lg text-foreground">
                      {selectedDay} de {selectedMonth.replace("-", "/")}
                    </h3>
                    <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {dayEtapas.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma etapa com prazo neste dia.</p>
                  ) : (
                    <div className="space-y-3">
                      {dayEtapas.map((e) => (
                        <div key={e.id} className="bg-muted/30 border border-border/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-display font-semibold text-primary">E{e.step_number}</span>
                            <StatusBadge status={e.status} />
                          </div>
                          <p className="text-sm text-foreground">{e.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">Área: {e.area}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
