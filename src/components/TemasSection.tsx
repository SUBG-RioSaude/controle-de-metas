"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { ExternalLink, ChevronDown, Users } from "lucide-react";
import { getTemas } from "@/lib/metas-api";
import { META_STATUS_CONFIG, type ApiTema, type ApiTopico, type MetaStatus } from "@/lib/types";
import SpotlightCard from "@/components/SpotlightCard";

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TemasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/3 bg-white/[0.06] rounded" />
            </div>
            <div className="h-5 w-20 bg-white/[0.06] rounded-full ml-4" />
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-10 bg-white/[0.04] rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Status badge inline ───────────────────────────────────────────────────────

function MetaStatusBadge({ status }: { status: MetaStatus }) {
  const cfg = META_STATUS_CONFIG[status] ?? META_STATUS_CONFIG.NaoIniciada;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.color} shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Extrai tipo do nome (Estratégico, Tático etc.) ────────────────────────────

function extractTipo(nome: string): string | null {
  const match = nome.match(/\(([^)]+)\)$/);
  return match ? match[1] : null;
}

// ── Card de tópico dentro do accordion ───────────────────────────────────────

function TopicoAccordionItem({ topico, index }: { topico: ApiTopico; index: number }) {
  const totalMetas = topico.metas.length;
  const concluidas = topico.metas.filter(
    (m) => m.status === "Concluida" || m.status === "DocumentoGerado"
  ).length;

  return (
    <Accordion.Item
      value={topico.id}
      className="border border-white/[0.08] rounded-xl overflow-hidden"
    >
      <Accordion.Trigger className="group w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors data-[state=open]:bg-white/[0.04]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-[10px] font-mono text-white/25 tabular-nums">
            {(() => { const m = topico.descricao.match(/Etapa\s+(\d+)/i); return m ? String(parseInt(m[1], 10)).padStart(2, "0") : String(index + 1).padStart(2, "0"); })()}
          </span>
          <p className="text-xs text-white/70 truncate leading-snug">
            {topico.descricao}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {topico.setorNomes.length > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
              {topico.setorNomes.join(", ")}
            </span>
          )}
          <span className="text-[10px] text-white/30 tabular-nums whitespace-nowrap">
            {totalMetas > 0 ? `${concluidas}/${totalMetas}` : "0"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/30 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
        </div>
      </Accordion.Trigger>

      <Accordion.Content className="overflow-hidden data-[state=open]:animate-[slideDown_200ms_ease] data-[state=closed]:animate-[slideUp_200ms_ease]">
        <div className="px-4 pb-4 pt-2 space-y-4">
          {/* Pontos focais */}
          {topico.pontosFocais.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {topico.pontosFocais.map((pf) => (
                  <span
                    key={pf}
                    className="text-[10px] text-white/50 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5"
                  >
                    {pf}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metas */}
          {topico.metas.length > 0 ? (
            <ul className="space-y-2">
              {topico.metas.map((meta) => {
                const cfg = META_STATUS_CONFIG[meta.status] ?? META_STATUS_CONFIG.NaoIniciada;
                return (
                  <li
                    key={meta.id}
                    className="flex items-start gap-2.5 rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.06]"
                  >
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                    />
                    <p className="flex-1 text-xs text-white/60 leading-relaxed">
                      {meta.descricao}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <MetaStatusBadge status={meta.status} />
                      {meta.documentUrl && (
                        <a
                          href={meta.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#42b9eb]/70 hover:text-[#42b9eb] transition-colors"
                          title="Ver documento"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-white/25 italic">Nenhuma meta cadastrada.</p>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

// ── Card de tema ──────────────────────────────────────────────────────────────

function TemaCard({ tema, index }: { tema: ApiTema; index: number }) {
  const tipo = extractTipo(tema.nome);
  const nomeClean = tema.nome.replace(/ \([^)]+\)$/, "");

  const todasMetas = tema.topicos.flatMap((t) => t.metas);
  const total = todasMetas.length;
  const concluidas = todasMetas.filter(
    (m) => m.status === "Concluida" || m.status === "DocumentoGerado"
  ).length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <SpotlightCard
        spotlightColor="rgba(66, 185, 235, 0.12)"
        className="bg-white/[0.06] border border-white/10 rounded-2xl p-6 h-full flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-white leading-snug">
              {nomeClean}
            </p>
            <p className="text-[10px] text-white/30 font-mono mt-1 tabular-nums">
              {tema.topicos.length} {tema.topicos.length === 1 ? "tópico" : "tópicos"} &middot;{" "}
              {total} {total === 1 ? "meta" : "metas"}
            </p>
          </div>
          {tipo && (
            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
              {tipo}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-white/30">Progresso</span>
            <span className="text-[#42b9eb] font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#42b9eb]/60 to-[#42b9eb] rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.07 + 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-white/[0.06] mb-4" />

        {/* Accordion de tópicos */}
        {tema.topicos.length > 0 ? (
          <Accordion.Root type="multiple" className="space-y-2 flex-1">
            {[...tema.topicos]
              .sort((a, b) => {
                const n = (s: string) => { const m = s.match(/Etapa\s+(\d+)/i); return m ? parseInt(m[1], 10) : 9999; };
                return n(a.descricao) - n(b.descricao);
              })
              .map((topico, i) => (
              <TopicoAccordionItem key={topico.id} topico={topico} index={i} />
            ))}
          </Accordion.Root>
        ) : (
          <p className="text-xs text-white/25 italic flex-1">Nenhum tópico cadastrado.</p>
        )}
      </SpotlightCard>
    </motion.div>
  );
}

// ── TemasSection ──────────────────────────────────────────────────────────────

export function TemasSection() {
  const { data: temas, isLoading, isError, error } = useQuery({
    queryKey: ["temas"],
    queryFn: getTemas,
  });

  const totalTopicos = temas?.reduce((acc, t) => acc + t.topicos.length, 0) ?? 0;
  const totalMetas = temas?.reduce(
    (acc, t) => acc + t.topicos.reduce((a, tp) => a + tp.metas.length, 0),
    0
  ) ?? 0;

  return (
    <section id="temas" className="py-32 relative">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-xs font-medium text-[#42b9eb] uppercase tracking-[0.2em] mb-3 block">
            Acompanhamento
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Temas Estratégicos
          </h2>
          <p className="text-white/40 max-w-lg text-lg mb-6">
            Tópicos e metas organizados por tema, com status atualizado em tempo real.
          </p>

          {/* Badges de contagem */}
          {!isLoading && !isError && temas && (
            <div className="flex flex-wrap gap-3">
              {[
                { label: `${temas.length} ${temas.length === 1 ? "tema" : "temas"}` },
                { label: `${totalTopicos} ${totalTopicos === 1 ? "tópico" : "tópicos"}` },
                { label: `${totalMetas} ${totalMetas === 1 ? "meta" : "metas"}` },
              ].map(({ label }, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] border border-white/10 text-white/60"
                >
                  {label}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Conteúdo */}
        {isLoading && <TemasSkeleton />}

        {isError && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-8 py-10 text-center max-w-sm">
              <p className="text-white/40 text-sm">
                Não foi possível carregar os temas.
              </p>
              {error instanceof Error && (
                <p className="text-white/20 text-xs mt-2 font-mono">{error.message}</p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !isError && temas && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {temas.map((tema, i) => (
              <TemaCard key={tema.id} tema={tema} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
