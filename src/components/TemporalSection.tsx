"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, X, Pause, Play } from "lucide-react";
import { getDashboardStats } from "@/lib/metas-api";
import type {
  ApiDashboardStats,
  ApiDashboardCalendarioMeta,
} from "@/lib/types";
import { META_STATUS_CONFIG } from "@/lib/types";
import { AnimatedCounter } from "./AnimatedCounter";

type TabId = "evolucao" | "calendario";

const TABS = [
  { id: "evolucao" as const, label: "Evolução Temporal", Icon: TrendingUp },
  { id: "calendario" as const, label: "Visão Temporal", Icon: Calendar },
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const AUTOPLAY_MS = 7000;

export function TemporalSection() {
  const [data, setData] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("evolucao");
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedMes, setSelectedMes] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const startRef = useRef(Date.now());
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then((d) => {
        setData(d);
        if (d.visaoCalendario[0]) setSelectedMes(d.visaoCalendario[0].mes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused) {
      setProgress(0);
      return;
    }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / AUTOPLAY_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= AUTOPLAY_MS) {
        setActiveTab((t) => (t === "evolucao" ? "calendario" : "evolucao"));
        startRef.current = Date.now();
      }
    }, 40);
    return () => clearInterval(interval);
  }, [paused]);

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), 12000);
  };

  const togglePause = () => {
    if (!paused) {
      setPaused(true);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    } else {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
      setPaused(false);
    }
  };

  const currentMes = data?.visaoCalendario.find((v) => v.mes === selectedMes);

  const calendarDays = useMemo(() => {
    if (!selectedMes) return [];
    const [year, month] = selectedMes.split("/").map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [selectedMes]);

  const metasByDay = useMemo(() => {
    const map: Record<number, ApiDashboardCalendarioMeta[]> = {};
    currentMes?.metas.forEach((m) => {
      const day = parseInt(m.data.split("-")[2]);
      if (!map[day]) map[day] = [];
      map[day].push(m);
    });
    return map;
  }, [currentMes]);

  const chartData = useMemo(
    () =>
      (data?.evolucaoMensal ?? []).map((m) => ({
        name: m.mes,
        "Não Iniciadas": m.naoIniciadas,
        "Em Andamento": m.emAndamento,
        Concluídas: m.concluidas,
        Aguardando: m.aguardandoRetorno,
      })),
    [data]
  );

  const modalMetas: ApiDashboardCalendarioMeta[] =
    selectedDay !== null ? (metasByDay[selectedDay] ?? []) : [];

  return (
    <section id="analise" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh-bg" />
      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <span className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3 block">
            Análise Temporal
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Visão Consolidada
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg">
            Evolução mensal e calendário de metas integrados em uma só visão.
          </p>
        </motion.div>

        {/* Tab bar + autoplay controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex gap-1 glass-panel p-1 rounded-xl w-fit">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={togglePause}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {paused ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              {paused ? "Retomar" : "Pausar"}
            </button>
            <div className="w-24 h-1 bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-none"
                style={{ width: `${paused ? 0 : progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "evolucao" && (
            <motion.div
              key="evolucao"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-6 md:p-10"
            >
              {loading ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                  Carregando dados...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(213 30% 20%)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "hsl(213 20% 50%)",
                        fontSize: 11,
                        fontFamily: "Inter",
                      }}
                      axisLine={{ stroke: "hsl(213 30% 20%)" }}
                    />
                    <YAxis
                      tick={{
                        fill: "hsl(213 20% 50%)",
                        fontSize: 11,
                        fontFamily: "Inter",
                      }}
                      axisLine={{ stroke: "hsl(213 30% 20%)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(213 50% 12%)",
                        border: "1px solid hsl(213 30% 22%)",
                        borderRadius: "12px",
                        color: "hsl(210 33% 97%)",
                        fontFamily: "Inter",
                        fontSize: 13,
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontFamily: "Inter",
                        fontSize: 12,
                        color: "hsl(213 20% 55%)",
                      }}
                    />
                    <Bar
                      dataKey="Não Iniciadas"
                      fill="hsl(220 9% 46%)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Em Andamento"
                      fill="hsl(43 96% 56%)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Concluídas"
                      fill="hsl(189 100% 44%)"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Aguardando"
                      fill="hsl(25 95% 53%)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          )}

          {activeTab === "calendario" && (
            <motion.div
              key="calendario"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <div className="glass-panel h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                  Carregando dados...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div className="glass-panel p-4 space-y-1">
                      {data?.visaoCalendario.map((v) => (
                        <button
                          key={v.mes}
                          onClick={() => {
                            setSelectedMes(v.mes);
                            setSelectedDay(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMes === v.mes
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                          }`}
                        >
                          {v.mes}
                        </button>
                      ))}
                    </div>

                    {currentMes && (
                      <div className="glass-panel p-4 space-y-3">
                        {[
                          {
                            label: "Concluídas",
                            value: currentMes.concluidas,
                            cls: "text-emerald-400",
                          },
                          {
                            label: "Em Andamento",
                            value: currentMes.emAndamento,
                            cls: "text-yellow-300",
                          },
                          {
                            label: "Doc. Gerado",
                            value: currentMes.documentosGerados,
                            cls: "text-[#42b9eb]",
                          },
                          {
                            label: "Não Iniciadas",
                            value: currentMes.naoIniciadas,
                            cls: "text-white/40",
                          },
                          {
                            label: "Aguardando",
                            value: currentMes.aguardando,
                            cls: "text-orange-400",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-muted-foreground">
                              {item.label}
                            </span>
                            <AnimatedCounter
                              value={item.value}
                              className={`text-lg ${item.cls}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Calendar grid */}
                  <motion.div
                    key={selectedMes}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-panel overflow-hidden"
                  >
                    <div className="bg-secondary/30 p-5 text-center border-b border-border/30">
                      <h3 className="font-display font-bold text-lg text-foreground">
                        {selectedMes}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentMes?.metas.length ?? 0} metas no mês
                      </p>
                    </div>
                    <div className="grid grid-cols-7">
                      {WEEKDAYS.map((d) => (
                        <div
                          key={d}
                          className="p-3 text-center text-xs font-bold text-primary/70 uppercase border-b border-border/20"
                        >
                          {d}
                        </div>
                      ))}
                      {calendarDays.map((day, i) => {
                        const cellMetas = day ? metasByDay[day] : undefined;
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              day && cellMetas && setSelectedDay(day)
                            }
                            className={`min-h-[72px] p-2 border-b border-r border-border/10 transition-colors ${
                              day && cellMetas
                                ? "cursor-pointer hover:bg-primary/5"
                                : ""
                            } ${!day ? "bg-muted/10" : ""}`}
                          >
                            {day && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {day}
                                </span>
                                {cellMetas && (
                                  <div className="mt-1">
                                    <div className="flex gap-0.5 flex-wrap">
                                      {cellMetas.slice(0, 3).map((_, j) => (
                                        <div
                                          key={j}
                                          className="w-1.5 h-1.5 rounded-full bg-primary"
                                        />
                                      ))}
                                      {cellMetas.length > 3 && (
                                        <span className="text-[10px] text-muted-foreground ml-0.5">
                                          +{cellMetas.length - 3}
                                        </span>
                                      )}
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Day detail modal */}
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
                    {selectedDay} de {selectedMes}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {modalMetas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma meta com prazo neste dia.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {modalMetas.map((m) => {
                      const cfg = META_STATUS_CONFIG[m.status];
                      return (
                        <div
                          key={m.id}
                          className={`border rounded-xl p-4 ${cfg.bg}`}
                        >
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block mb-2 ${cfg.bg} ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                          <p className="text-sm text-foreground">{m.descricao}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
