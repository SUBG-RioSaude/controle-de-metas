"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import * as Accordion from "@radix-ui/react-accordion";
import { getTemas } from "@/lib/metas-api";
import {
  type ApiTema,
  type ApiTopico,
  type MetaStatus,
  type EtapaStatus,
  type PlanoDeAcao,
  type Etapa,
  META_STATUS_CONFIG,
  STATUS_LIST,
} from "@/lib/types";

const ETAPA_STATUS_DOT: Record<string, string> = {
  "Não Iniciada": "bg-white/30",
  "Em Andamento": "bg-yellow-300",
  "Concluída": "bg-emerald-400",
  "Documento Gerado": "bg-[#42b9eb]",
  "Aguardando retorno da área": "bg-orange-400",
};
import { StatusBadge } from "./StatusBadge";
import { AnimatedCounter } from "./AnimatedCounter";
import SpotlightCard from "@/components/SpotlightCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Users,
  Target,
  LayoutGrid,
  Layers,
  X,
  ChevronsUpDown,
  Search,
  FileText,
} from "lucide-react";

// ── Constantes ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Utilitários ───────────────────────────────────────────────────────────────

function mapStatus(apiStatus: string): EtapaStatus {
  const map: Record<string, EtapaStatus> = {
    NaoIniciada: "Não Iniciada",
    EmAndamento: "Em Andamento",
    Concluida: "Concluída",
    DocumentoGerado: "Documento Gerado",
    AguardandoRetorno: "Aguardando retorno da área",
  };
  return map[apiStatus] ?? "Não Iniciada";
}

function temaToPlano(tema: ApiTema, index: number): PlanoDeAcao {
  return {
    id: tema.id,
    code: "PA" + String(index + 1).padStart(2, "0"),
    title: tema.nome.replace(/ \(.*\)$/, ""),
    description: tema.topicos[0]?.descricao ?? "—",
    area:
      [...new Set(tema.topicos.flatMap((t) => t.setorNomes).filter(Boolean))].join(", ") || "—",
    created_at: tema.createdAt,
  };
}

function temaToEtapas(tema: ApiTema, code: string): Etapa[] {
  const etapas: Etapa[] = [];
  let stepIndex = 0;
  for (const topico of tema.topicos) {
    for (const meta of topico.metas) {
      etapas.push({
        id: meta.id,
        plan_id: tema.id,
        topico_id: topico.id,
        step_number: stepIndex + 1,
        description: meta.descricao,
        tema: topico.descricao,
        relacao_direta: code,
        area: topico.setorNomes.join(", ") || "—",
        areas: topico.setorNomes,
        prazo: "—",
        status: mapStatus(meta.status),
        documento_comprobatorio: topico.temDocumentoOficial ? "SIM" : "NÃO",
        drive_link: meta.documentUrl ?? "",
        created_at: meta.createdAt,
      });
      stepIndex++;
    }
  }
  return etapas;
}

function extractTipo(nome: string): string | null {
  const match = nome.match(/\(([^)]+)\)$/);
  return match ? match[1] : null;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white/[0.05] border border-white/[0.07] rounded-2xl p-5 animate-pulse"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 bg-white/10 rounded" />
              <div className="h-2.5 w-1/3 bg-white/[0.06] rounded" />
            </div>
            <div className="h-5 w-20 bg-white/[0.06] rounded-full ml-4" />
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full mb-3" />
          <div className="h-2.5 w-1/2 bg-white/[0.06] rounded" />
        </div>
      ))}
    </div>
  );
}

// ── MetaStatusBadge ───────────────────────────────────────────────────────────

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

// ── TopicoAccordionItem ───────────────────────────────────────────────────────

function TopicoAccordionItem({
  topico,
  index,
  temaId,
}: {
  topico: ApiTopico;
  index: number;
  temaId: string;
}) {
  const totalMetas = topico.metas.length;
  const concluidas = topico.metas.filter(
    (m) => m.status === "Concluida" || m.status === "DocumentoGerado"
  ).length;
  const pct = totalMetas > 0 ? Math.round((concluidas / totalMetas) * 100) : 0;
  // value único por tema + tópico para evitar colisão entre sheets re-renderizados
  const itemValue = `${temaId}-${topico.id}`;

  return (
    <Accordion.Item
      value={itemValue}
      className="border rounded-xl overflow-hidden group/item transition-all duration-200 border-white/[0.07] data-[state=open]:border-[#42b9eb]/30 data-[state=open]:shadow-[0_0_0_1px_rgba(66,185,235,0.08),0_0_24px_rgba(66,185,235,0.06)]"
    >
      <Accordion.Trigger className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.04] data-[state=open]:bg-[#42b9eb]/[0.04] transition-colors">
        {/* Número */}
        <span className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-semibold tabular-nums transition-colors duration-200 bg-white/[0.06] border border-white/[0.08] text-white/40 group-data-[state=open]/item:bg-[#42b9eb]/10 group-data-[state=open]/item:border-[#42b9eb]/30 group-data-[state=open]/item:text-[#42b9eb]">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Descrição + mini progress */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/70 line-clamp-2 leading-snug mb-2">
            {topico.descricao}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#42b9eb]/60 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-white/30 tabular-nums whitespace-nowrap shrink-0">
              {concluidas}/{totalMetas}
            </span>
          </div>
        </div>

        {/* Setor + chevron */}
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {topico.setorNomes.length > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb] text-center">
              {topico.setorNomes.join(", ")}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-white/25 transition-transform duration-200 group-data-[state=open]/item:rotate-180 shrink-0" />
        </div>
      </Accordion.Trigger>

      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Pontos focais */}
          {topico.pontosFocais.length > 0 && (
            <div className="flex items-start gap-2 pt-1">
              <Users className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {topico.pontosFocais.map((pf) => (
                  <span
                    key={pf}
                    className="text-[10px] text-white/45 bg-white/[0.05] border border-white/[0.07] rounded px-1.5 py-0.5"
                  >
                    {pf}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metas */}
          {topico.metas.length > 0 ? (
            <ul className="space-y-1.5">
              {topico.metas.map((meta) => {
                const cfg = META_STATUS_CONFIG[meta.status] ?? META_STATUS_CONFIG.NaoIniciada;
                return (
                  <li
                    key={meta.id}
                    className="flex items-start gap-2.5 rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.08] transition-colors"
                  >
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <p className="flex-1 text-xs text-white/55 leading-relaxed">{meta.descricao}</p>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <MetaStatusBadge status={meta.status} />
                      {meta.documentUrl && (
                        <a
                          href={meta.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#42b9eb]/50 hover:text-[#42b9eb] transition-colors"
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

          {/* Documentos aprovados */}
          {topico.documentosAprovados?.length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5 mb-2">
                <FileText className="w-3 h-3" />Documentos Oficiais
              </p>
              <ul className="space-y-1.5">
                {topico.documentosAprovados.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.driveOficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[11px] text-[#42b9eb]/70 hover:text-[#42b9eb] transition-colors group"
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="underline underline-offset-2 decoration-[#42b9eb]/30 group-hover:decoration-[#42b9eb] truncate max-w-[280px]">
                        {doc.nome}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

// ── TemaSheet ─────────────────────────────────────────────────────────────────

function TemaSheet({
  tema,
  open,
  onClose,
  defaultOpenTopico,
}: {
  tema: ApiTema | null;
  open: boolean;
  onClose: () => void;
  defaultOpenTopico?: string;
}) {
  const todasMetas = tema?.topicos.flatMap((t) => t.metas) ?? [];
  const total = todasMetas.length;
  const concluidas = todasMetas.filter(
    (m) => m.status === "Concluida" || m.status === "DocumentoGerado"
  ).length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const tipo = tema ? extractTipo(tema.nome) : null;
  const nomeClean = tema?.nome.replace(/ \([^)]+\)$/, "") ?? "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="!bg-[#0b1929] !border-l !border-white/[0.08] !p-0 !w-full sm:!max-w-xl flex flex-col gap-0"
      >
        {/* Cabeçalho */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <SheetTitle className="!text-white !font-display !font-bold !text-xl leading-snug pr-8">
              {nomeClean}
            </SheetTitle>
            {tipo && (
              <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
                {tipo}
              </span>
            )}
          </div>

          {/* Progresso geral */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/35">Progresso geral</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[#42b9eb] font-semibold tabular-nums">{pct}%</span>
                <span className="text-white/25">·</span>
                <span className="text-white/35 tabular-nums">
                  {concluidas}/{total} metas
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#42b9eb]/60 to-[#42b9eb] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: open ? `${pct}%` : 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>

          {/* Chips de contagem */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: `${tema?.topicos.length ?? 0} metas` },
              { label: `${total} objetivos` },
            ].map(({ label }) => (
              <span
                key={label}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/[0.08] text-white/45"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Accordion de tópicos — scroll independente */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {tema && tema.topicos.length > 0 ? (
            <Accordion.Root type="single" collapsible className="space-y-2" defaultValue={defaultOpenTopico}>
              {[...tema.topicos].sort((a, b) => {
                  const n = (s: string) => { const m = s.match(/Etapa\s+(\d+)/i); return m ? parseInt(m[1], 10) : 9999; };
                  return n(a.descricao) - n(b.descricao);
                }).map((topico, i) => (
                <TopicoAccordionItem
                  key={topico.id}
                  topico={topico}
                  index={i}
                  temaId={tema.id}
                />
              ))}
            </Accordion.Root>
          ) : (
            <p className="text-xs text-white/25 italic text-center py-8">
              Nenhum tópico cadastrado.
            </p>
          )}
        </div>

        {/* Botão fechar customizado no rodapé */}
        <div className="px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/45 text-xs font-medium hover:bg-white/[0.08] hover:text-white/65 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Fechar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── TemaCard — compacto, sem accordion ───────────────────────────────────────

function TemaCard({
  tema,
  index,
  selected,
  onClick,
  onOpenSheet,
}: {
  tema: ApiTema;
  index: number;
  selected: boolean;
  onClick: () => void;
  onOpenSheet: () => void;
}) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`w-full text-left group cursor-pointer transition-all duration-300 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#42b9eb]/50 ${
        selected
          ? "ring-1 ring-[#42b9eb]/40 shadow-[0_0_28px_hsl(196_100%_40%/0.12)]"
          : ""
      }`}
    >
      <SpotlightCard
        spotlightColor="rgba(66, 185, 235, 0.1)"
        className={`bg-white/[0.05] border rounded-2xl p-5 h-full flex flex-col transition-colors duration-300 ${
          selected
            ? "border-[#42b9eb]/35"
            : "border-white/[0.08] hover:border-white/[0.15]"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-sm font-display font-semibold text-white leading-snug line-clamp-2 flex-1">
            {nomeClean}
          </p>
          {tipo && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
              {tipo}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-white/70">Progresso</span>
            <span className={`font-semibold tabular-nums ${selected ? "text-[#42b9eb]" : "text-white/85"}`}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-white/[0.18] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${
                selected
                  ? "bg-gradient-to-r from-[#42b9eb]/90 to-[#42b9eb]"
                  : "bg-white/55"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, delay: index * 0.05 + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.10]">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSheet(); }}
            className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
              selected
                ? "border-[#42b9eb]/35 text-[#42b9eb] hover:border-[#42b9eb]/60 hover:bg-[#42b9eb]/[0.08]"
                : "border-white/30 text-white/75 hover:text-white hover:border-white/55 hover:bg-white/[0.06]"
            }`}
          >
            <Layers className="w-3 h-3" />
            Ver tópicos
          </button>

          <span
            className={`flex items-center gap-1.5 text-[10px] font-medium transition-colors ${
              selected ? "text-[#42b9eb]" : "text-white/65 group-hover:text-white/90"
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            {selected ? "Selecionado" : "Ver objetivos"}
          </span>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

// ── PlanosSection ─────────────────────────────────────────────────────────────

export function PlanosSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpenTopico, setSheetOpenTopico] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EtapaStatus | "all">("all");
  const prevSelectedId = useRef<string | null>(null);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!selectedId || prevSelectedId.current === null) {
      prevSelectedId.current = selectedId;
      return;
    }
    if (prevSelectedId.current !== selectedId) {
      prevSelectedId.current = selectedId;
      setTableLoading(true);
      const t = setTimeout(() => setTableLoading(false), 280);
      return () => clearTimeout(t);
    }
  }, [selectedId]);

  const { data: temas, isLoading, isError } = useQuery({
    queryKey: ["temas"],
    queryFn: getTemas,
  });

  const planos: PlanoDeAcao[] = (temas ?? []).map((t, i) => temaToPlano(t, i));

  const etapasByPlan: Record<string, Etapa[]> = {};
  planos.forEach((plano, i) => {
    etapasByPlan[plano.id] = temaToEtapas((temas ?? [])[i], plano.code);
  });

  const selectedTema = temas?.find((t) => t.id === selectedId) ?? null;
  const sheetTema = temas?.find((t) => t.id === sheetId) ?? null;
  const selectedPlan = planos.find((p) => p.id === selectedId);
  const planObjetivos = (selectedId ? (etapasByPlan[selectedId] ?? []) : [])
    .slice()
    .sort((a, b) => {
      const num = (s: string) => { const m = s.match(/Meta\s+(\d+)/i); return m ? parseInt(m[1], 10) : 9999; };
      return num(a.tema) - num(b.tema);
    });
  const q = searchQuery.trim().toLowerCase();
  const filteredObjetivos = planObjetivos.filter((e) => {
    const matchesSearch = !q ||
      e.description.toLowerCase().includes(q) ||
      e.tema.toLowerCase().includes(q) ||
      e.area.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredObjetivos.length / PAGE_SIZE);
  const pagedObjetivos = filteredObjetivos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const completed = planObjetivos.filter(
    (e) => e.status === "Concluída" || e.status === "Documento Gerado"
  ).length;
  const pct = planObjetivos.length > 0 ? Math.round((completed / planObjetivos.length) * 100) : 0;

  const totalTopicos = (temas ?? []).reduce((acc, t) => acc + t.topicos.length, 0);
  const totalMetas = (temas ?? []).reduce(
    (acc, t) => acc + t.topicos.reduce((a, tp) => a + tp.metas.length, 0),
    0
  );

  return (
    <section id="planos" className="py-32 relative">
      <span id="temas" className="absolute -top-20" aria-hidden />

      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="text-xs font-medium text-[#42b9eb] uppercase tracking-[0.2em] mb-3 block">
            Acompanhamento
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Estratégia & Planos
          </h2>
          <p className="text-white/40 max-w-lg text-lg">
            Visualize o status dos temas do Plano de Ação em tempo real.
          </p>
        </motion.div>

        {/* Loading / Error */}
        {isLoading && <Skeleton />}

        {isError && (
          <div className="flex items-center justify-center py-20">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-8 py-10 text-center max-w-sm">
              <p className="text-white/40 text-sm">Não foi possível carregar os dados.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && temas && (
          <>
            {/* Stats chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                `${temas.length} ${temas.length === 1 ? "tema" : "temas"}`,
                `${totalTopicos} ${totalTopicos === 1 ? "meta" : "metas"}`,
                `${totalMetas} ${totalMetas === 1 ? "objetivo" : "objetivos"}`,
              ].map((label, i) => (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-white/50"
                >
                  {label}
                </motion.span>
              ))}
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {temas.map((tema, i) => (
                <TemaCard
                  key={tema.id}
                  tema={tema}
                  index={i}
                  selected={selectedId === tema.id}
                  onClick={() => {
                    setSelectedId(selectedId === tema.id ? null : tema.id);
                    setPage(1);
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  onOpenSheet={() => setSheetId(tema.id)}
                />
              ))}
            </div>

            {/* Tabela inline — aparece abaixo do grid com AnimatePresence */}
            <AnimatePresence>
              {selectedId && selectedPlan && (
                <motion.div
                  key="table-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  {/* Header do plano selecionado */}
                  <div className="glass-panel p-8 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                          {selectedPlan.title}
                        </h3>
                        <p className="text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                      <button
                        onClick={() => setSheetId(selectedId)}
                        className="shrink-0 flex items-center gap-1.5 text-[11px] text-white/30 hover:text-[#42b9eb] transition-colors px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-[#42b9eb]/20"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Tópicos
                      </button>
                      <div className="shrink-0 text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <AnimatedCounter value={completed} className="text-3xl text-primary" />
                          <span className="text-muted-foreground text-lg">/</span>
                          <AnimatedCounter value={planObjetivos.length} className="text-3xl text-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          objetivos &bull; {mounted ? `${pct}%` : "--%"} concluído
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Busca + filtros */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    {/* Input de busca */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        placeholder="Buscar por descrição, tema ou área…"
                        className="w-full pl-8 pr-8 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#42b9eb]/30 focus:bg-white/[0.06] transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(""); setPage(1); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Pills de status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => { setStatusFilter("all"); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                          statusFilter === "all"
                            ? "bg-white/[0.08] border-white/20 text-white/70"
                            : "border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/[0.12]"
                        }`}
                      >
                        Todos
                      </button>
                      {STATUS_LIST.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setPage(1); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                            statusFilter === s
                              ? "bg-white/[0.08] border-white/20 text-white/70"
                              : "border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/[0.12]"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ETAPA_STATUS_DOT[s] ?? "bg-white/30"}`} />
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tabela de etapas */}
                  <div className="glass-panel">
                    <div className="w-full">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/50">
                            {["Tema", "Meta", "Descritivo", "Área", "Status", "Doc"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="text-left px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {tableLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                              <tr key={i} className="border-b border-border/20">
                                <td className="px-4 py-3"><div className="h-3 w-6 rounded bg-white/[0.06] animate-pulse" /></td>
                                <td className="px-4 py-3"><div className="h-3 rounded bg-white/[0.06] animate-pulse" style={{ width: `${55 + (i * 17) % 35}%` }} /></td>
                                <td className="px-4 py-3"><div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" /></td>
                                <td className="px-4 py-3"><div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" /></td>
                                <td className="px-4 py-3"><div className="h-5 w-20 rounded-full bg-white/[0.06] animate-pulse" /></td>
                                <td className="px-4 py-3"><div className="h-3 w-8 rounded bg-white/[0.06] animate-pulse" /></td>
                              </tr>
                            ))
                          ) : pagedObjetivos.map((objetivo, i) => {
                            const objetivoNum = (() => { const m = objetivo.tema.match(/Meta\s+(\d+)/i); return m ? parseInt(m[1], 10) : objetivo.step_number; })();
                            const prevNum  = i > 0 ? (() => { const m = pagedObjetivos[i - 1].tema.match(/Meta\s+(\d+)/i); return m ? parseInt(m[1], 10) : pagedObjetivos[i - 1].step_number; })() : null;
                            const isFirstOfGroup = prevNum !== objetivoNum;
                            return (
                              <motion.tr
                                key={objetivo.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => {
                                  setSheetId(objetivo.plan_id);
                                  setSheetOpenTopico(`${objetivo.plan_id}-${objetivo.topico_id}`);
                                }}
                                className={`border-b border-border/20 hover:bg-accent/20 transition-colors cursor-pointer ${
                                  isFirstOfGroup && i !== 0 ? "border-t-2 border-t-white/10" : ""
                                }`}
                              >
                                <td className="px-4 py-2.5 text-muted-foreground max-w-[200px]">
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="group inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md border border-transparent hover:border-border/60 hover:bg-accent/40 transition-all cursor-default">
                                          <span className="truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                            {objetivo.tema.replace(/^Meta\s+\d+\.\s*/i, "")}
                                          </span>
                                          <ChevronsUpDown className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="start" className="max-w-xs p-3">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tema</p>
                                        <p className="text-xs text-popover-foreground leading-relaxed">
                                          {objetivo.tema.replace(/^Meta\s+\d+\.\s*/i, "")}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
                                    Meta {String(objetivoNum).padStart(2, "0")}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-foreground max-w-[400px]">
                                  {objetivo.description}
                                </td>
                                <td className="px-4 py-2.5">
                                  {objetivo.areas.length === 0 ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {objetivo.areas.map((area) => (
                                        <span
                                          key={area}
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#42b9eb]/[0.08] border border-[#42b9eb]/20 text-[#42b9eb]/80 whitespace-nowrap leading-tight"
                                        >
                                          {area}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <StatusBadge status={objetivo.status} />
                                </td>
                                <td className={`px-4 py-2.5 font-bold ${objetivo.documento_comprobatorio === "SIM" ? "text-emerald-400" : "text-rose-400/50"}`}>
                                  {objetivo.documento_comprobatorio}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {!tableLoading && filteredObjetivos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                          <Search className="w-5 h-5 text-white/15" />
                          <p className="text-xs text-white/25">Nenhum objetivo encontrado para este filtro.</p>
                          <button
                            onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                            className="text-[11px] text-[#42b9eb]/50 hover:text-[#42b9eb] transition-colors mt-1"
                          >
                            Limpar filtros
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-5 py-4 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">
                          Objetivos{" "}
                          <span className="font-medium text-foreground">
                            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredObjetivos.length)}
                          </span>{" "}
                          de{" "}
                          <span className="font-medium text-foreground">{filteredObjetivos.length}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </button>

                          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                                p === page
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                              }`}
                            >
                              {p}
                            </button>
                          ))}

                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TemaSheet para drill-down de tópicos */}
            <TemaSheet
              tema={sheetTema}
              open={sheetTema !== null}
              onClose={() => { setSheetId(null); setSheetOpenTopico(undefined); }}
              defaultOpenTopico={sheetOpenTopico}
            />
          </>
        )}
      </div>

    </section>
  );
}
