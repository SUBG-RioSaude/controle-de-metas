"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { etapas } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ScrollIndicator } from "@/components/ui/ScrollIndicator";

export function AnaliseSection() {
  const monthlyData = useMemo(() => {
    const months: Record<string, { naoIniciadas: number; emAndamento: number; concluidas: number }> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `2026/${String(m).padStart(2, "0")}`;
      months[key] = { naoIniciadas: 0, emAndamento: 0, concluidas: 0 };
    }
    etapas.forEach((e) => {
      const month = e.prazo.substring(0, 7).replace("-", "/");
      if (months[month]) {
        if (e.status === "Não Iniciada") months[month].naoIniciadas++;
        else if (e.status === "Em Andamento") months[month].emAndamento++;
        else months[month].concluidas++;
      }
    });
    return Object.entries(months).map(([name, data]) => ({ name, ...data }));
  }, []);

  return (
    <section id="analise" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh-bg" />
      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-xs font-medium text-primary uppercase tracking-[0.2em] mb-3 block">Análise Mensal</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
            Evolução Temporal
          </h2>
          <p className="text-muted-foreground max-w-lg text-lg">
            Distribuição das etapas por mês e status ao longo de 2026.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-6 md:p-10"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213 30% 20%)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(213 20% 50%)", fontSize: 11, fontFamily: "Inter" }}
                axisLine={{ stroke: "hsl(213 30% 20%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(213 20% 50%)", fontSize: 11, fontFamily: "Inter" }}
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
                wrapperStyle={{ fontFamily: "Inter", fontSize: 12, color: "hsl(213 20% 55%)" }}
              />
              <Bar dataKey="naoIniciadas" name="Não Iniciadas" fill="hsl(220 9% 46%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="emAndamento" name="Em Andamento" fill="hsl(43 96% 56%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="concluidas" name="Concluídas" fill="hsl(189 100% 44%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      <ScrollIndicator href="#calendario" />
    </section>
  );
}
