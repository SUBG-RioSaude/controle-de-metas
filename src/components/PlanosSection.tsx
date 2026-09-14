"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import * as Accordion from "@radix-ui/react-accordion";
import { getTemas } from "@/lib/metas-api";
import {
  dispararDownload,
  totalDocumentosDosTemas,
  totalDocumentosDoTema,
  urlDownloadDocumento,
  urlDownloadMeta,
  urlDownloadTema,
  urlDownloadTodosTemas,
} from "@/lib/downloads";
import {
  type ApiTema,
  type ApiTopico,
  type MetaStatus,
  type DocumentoPublico,
  META_STATUS_FILTER_OPTIONS,
  getMetaStatusConfig,
  isCompletedMetaStatus,
} from "@/lib/types";
import { AnimatedCounter } from "./AnimatedCounter";
import SpotlightCard from "@/components/SpotlightCard";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  ChevronDown,
  Users,
  LayoutGrid,
  Layers,
  X,
  Search,
  FileText,
  ArrowDownUp,
  Download,
} from "lucide-react";

// ── Utilitários ───────────────────────────────────────────────────────────────

function extractTipo(nome: string): string | null {
  const match = nome.match(/\(([^)]+)\)$/);
  return match ? match[1] : null;
}

function metaNumero(descricao: string): string {
  const match = descricao.match(/Meta\s+(\d+)/i);
  return match ? match[1] : "--";
}

// Chave numérica para ordenação — nunca retorna NaN (evita comparador
// instável em .sort() quando a descrição foge do padrão "Meta N.").
function metaOrdinal(descricao: string): number {
  const match = descricao.match(/Meta\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function fileExt(nome: string): string {
  const match = nome.match(/\.([a-z0-9]+)(?:\.pdf)?$/i);
  const raw = (match ? match[1] : "arq").toLowerCase();
  if (raw === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(raw)) return "xlsx";
  if (["pptx", "ppt"].includes(raw)) return "pptx";
  return raw;
}

function docPeriod(dateStr: string, today: Date): "30d" | "ano" | "antes" {
  const date = new Date(dateStr);
  const diffDays = (today.getTime() - date.getTime()) / 86400000;
  if (diffDays <= 30) return "30d";
  if (date.getFullYear() === today.getFullYear()) return "ano";
  return "antes";
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
  const cfg = getMetaStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.color} shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── BotaoDownload ─────────────────────────────────────────────────────────────

// Nunca renderizar dentro de um Accordion.Trigger: ele já é um <button>, e botão
// aninhado é HTML inválido. Todos os usos ficam em Content, card ou painel.
function BotaoDownload({
  url,
  label,
  title,
  disabled = false,
  className = "",
}: {
  url: string;
  label?: string;
  title: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        // O botão vive dentro de cards/linhas clicáveis — o clique para aqui.
        e.stopPropagation();
        dispararDownload(url);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border text-[10px] font-medium transition-all shrink-0 border-white/[0.14] text-white/70 hover:text-[#42b9eb] hover:border-[#42b9eb]/40 hover:bg-[#42b9eb]/[0.08] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/70 disabled:hover:border-white/[0.14] disabled:hover:bg-transparent ${
        label ? "px-2.5 py-1" : "p-1.5"
      } ${className}`}
    >
      <Download className="w-3 h-3 shrink-0" />
      {label}
    </button>
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
  const concluidas = topico.metas.filter((m) => isCompletedMetaStatus(m.status)).length;
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
                const cfg = getMetaStatusConfig(meta.status);
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
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />Documentos Oficiais
                </p>
                <BotaoDownload
                  url={urlDownloadMeta(topico.id)}
                  label="Baixar ZIP"
                  title={`Baixar os ${topico.documentosAprovados.length} documentos desta meta em ZIP`}
                />
              </div>
              <ul className="space-y-1.5">
                {topico.documentosAprovados.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2">
                    <a
                      href={doc.driveOficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 min-w-0 text-[11px] text-[#42b9eb]/70 hover:text-[#42b9eb] transition-colors group"
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="underline underline-offset-2 decoration-[#42b9eb]/30 group-hover:decoration-[#42b9eb] truncate max-w-[280px]">
                        {doc.nome}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50 group-hover:opacity-100" />
                    </a>
                    <BotaoDownload
                      url={urlDownloadDocumento(doc.id)}
                      title={`Baixar ${doc.nome}`}
                    />
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
  const concluidas = todasMetas.filter((m) => isCompletedMetaStatus(m.status)).length;
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
  const concluidas = todasMetas.filter((m) => isCompletedMetaStatus(m.status)).length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const totalDocs = totalDocumentosDoTema(tema);

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
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-white/[0.10]">
          <div className="flex items-center gap-1.5 min-w-0">
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
            <BotaoDownload
              url={urlDownloadTema(tema.id)}
              disabled={totalDocs === 0}
              title={
                totalDocs === 0
                  ? "Este tema ainda não possui documentos oficiais"
                  : `Baixar os ${totalDocs} documentos deste tema em ZIP`
              }
            />
          </div>

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

// ── DocumentosAnexados — busca, ordenação e filtro por período/tipo ──────────

function DocumentosAnexados({
  documentos,
  topicoId,
}: {
  documentos: DocumentoPublico[];
  topicoId: string;
}) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [period, setPeriod] = useState<"all" | "30d" | "ano">("all");
  const [type, setType] = useState<string>("all");

  if (documentos.length === 0) {
    return <p className="text-xs text-white/25 italic">Nenhum documento anexado a esta meta.</p>;
  }

  const today = new Date();
  const availableTypes = Array.from(new Set(documentos.map((d) => fileExt(d.nome))));
  const q = query.trim().toLowerCase();

  const filtered = documentos
    .filter((d) => !q || d.nome.toLowerCase().includes(q))
    .filter((d) => period === "all" || docPeriod(d.aprovadoEm, today) === period)
    .filter((d) => type === "all" || fileExt(d.nome) === type)
    .sort((a, b) => {
      const left = new Date(a.aprovadoEm).getTime();
      const right = new Date(b.aprovadoEm).getTime();
      return order === "desc" ? right - left : left - right;
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar documento..."
            className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#42b9eb]/30 transition-colors"
          />
        </div>

        <button
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/[0.08] text-white/45 hover:text-[#42b9eb] hover:border-[#42b9eb]/30 text-[10px] font-medium transition-colors shrink-0"
          title={order === "desc" ? "Mais recente primeiro" : "Mais antigo primeiro"}
        >
          <ArrowDownUp className="w-3 h-3" />
          {order === "desc" ? "Recente" : "Antigo"}
        </button>

        <Select value={period} onValueChange={(v) => setPeriod(v as "all" | "30d" | "ano")}>
          <SelectTrigger className="h-7 w-auto min-w-[110px] text-[11px] px-2 gap-1 bg-white/[0.04] border-white/[0.08] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>

        {availableTypes.length > 1 && (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-7 w-auto min-w-[90px] text-[11px] px-2 gap-1 bg-white/[0.04] border-white/[0.08] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo tipo</SelectItem>
              {availableTypes.map((t) => (
                <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-white/25">
          {filtered.length} de {documentos.length} documentos
        </p>
        {/* O ZIP leva a meta inteira — os filtros acima só afetam a lista exibida. */}
        <BotaoDownload
          url={urlDownloadMeta(topicoId)}
          label={`Baixar ${documentos.length} em ZIP`}
          title={`Baixar todos os ${documentos.length} documentos desta meta em ZIP (os filtros acima não se aplicam)`}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-white/25 italic">Nenhum documento encontrado com esses filtros.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          {filtered.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-1 rounded-lg pr-1.5 hover:bg-white/[0.03] transition-colors"
            >
              <a
                href={doc.driveOficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 min-w-0 items-center gap-2 text-[11px] text-[#42b9eb]/70 hover:text-[#42b9eb] transition-colors group px-2 py-1.5"
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span className="flex-1 min-w-0 truncate underline underline-offset-2 decoration-[#42b9eb]/30 group-hover:decoration-[#42b9eb]">
                  {doc.nome}
                </span>
                <span className="shrink-0 text-[9px] font-bold uppercase text-white/25 border border-white/10 rounded px-1">
                  {fileExt(doc.nome)}
                </span>
                <span className="shrink-0 text-white/25 whitespace-nowrap">
                  Anexado em {formatDate(doc.aprovadoEm)}
                </span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-50 group-hover:opacity-100" />
              </a>
              <BotaoDownload
                url={urlDownloadDocumento(doc.id)}
                title={`Baixar ${doc.nome}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── ExpandAllButton — chevron animado com Motion ─────────────────────────────

function ExpandAllButton({ allOpen, onClick }: { allOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/45 hover:text-[#42b9eb] hover:border-[#42b9eb]/30 text-[11px] font-medium transition-colors"
    >
      <motion.span
        animate={{ rotate: allOpen ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="inline-flex"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </motion.span>
      {allOpen ? "Recolher tudo" : "Expandir tudo"}
    </button>
  );
}

// ── MetaTopicoAccordion — accordion por Meta, sem sheet ──────────────────────

function MetaTopicoAccordion({
  topico,
  filters,
}: {
  topico: ApiTopico;
  filters: { status: MetaStatus | "all"; area: string; doc: "all" | "com" | "sem"; query: string };
}) {
  const numero = metaNumero(topico.descricao);
  const titulo = topico.descricao.replace(/^Meta\s+\d+\.\s*/i, "");
  const q = filters.query.trim().toLowerCase();

  const filteredMetas = topico.metas.filter((m) => {
    const statusOk = filters.status === "all" || m.status === filters.status;
    const textOk =
      !q || m.descricao.toLowerCase().includes(q) || topico.descricao.toLowerCase().includes(q);
    return statusOk && textOk;
  });

  const areaOk = filters.area === "all" || topico.setorNomes.includes(filters.area);
  const hasDocs = topico.documentosAprovados.length > 0;
  const docOk = filters.doc === "all" || (filters.doc === "com" ? hasDocs : !hasDocs);
  const anyFilterActive = Boolean(q) || filters.status !== "all" || filters.area !== "all" || filters.doc !== "all";
  const foraDoFiltro = anyFilterActive && !(areaOk && docOk);

  const total = topico.metas.length;
  const concluidas = topico.metas.filter((m) => isCompletedMetaStatus(m.status)).length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <Accordion.Item
      value={topico.id}
      className="border rounded-xl overflow-hidden border-white/[0.07] data-[state=open]:border-[#42b9eb]/30 transition-all duration-200"
    >
      <Accordion.Trigger className="w-full flex flex-wrap items-start gap-2.5 px-4 py-3.5 text-left hover:bg-white/[0.04] data-[state=open]:bg-[#42b9eb]/[0.04] transition-colors group">
        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb] mt-0.5">
          Meta {numero}
        </span>
        <span className="flex-1 min-w-[200px] text-sm font-medium text-white/85 leading-snug py-0.5">{titulo}</span>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/[0.08] text-white/45 shrink-0 mt-0.5">
          {filteredMetas.length}/{total} objetivos
        </span>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/[0.08] text-white/45 shrink-0 mt-0.5">
          {topico.documentosAprovados.length} docs
        </span>
        {foraDoFiltro && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-400/10 border border-orange-400/20 text-orange-400 shrink-0 mt-0.5">
            Fora do filtro
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-white/25 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 mt-1" />
      </Accordion.Trigger>

      <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-4 pb-4 pt-1 space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="p-2.5 border-r border-b sm:border-b-0 border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-wide text-white/25 mb-1">Progresso</p>
              <p className="text-xs font-semibold text-[#42b9eb]">{concluidas}/{total} · {pct}%</p>
            </div>
            <div className="p-2.5 border-b sm:border-b-0 sm:border-r border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-wide text-white/25 mb-1">Áreas</p>
              <p className="text-xs text-white/60 truncate">{topico.setorNomes.join(", ") || "—"}</p>
            </div>
            <div className="p-2.5 border-r border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-wide text-white/25 mb-1">Ponto focal</p>
              <p className="text-xs text-white/60 truncate">{topico.pontosFocais.join(", ") || "—"}</p>
            </div>
            <div className="p-2.5">
              <p className="text-[9px] uppercase tracking-wide text-white/25 mb-1">Documentos</p>
              <p className="text-xs text-white/60">{topico.documentosAprovados.length}</p>
            </div>
          </div>

          {foraDoFiltro && (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] text-white/40 leading-relaxed">
              Esta meta não corresponde ao filtro de área/documento selecionado. Ela continua visível — os objetivos abaixo são os dela normalmente.
            </div>
          )}

          {/* Objetivos — sem accordion, lista direta */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Objetivos</p>
            {filteredMetas.length === 0 ? (
              <p className="text-xs text-white/25 italic">
                Nenhum objetivo encontrado com os filtros aplicados nesta meta.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {filteredMetas.map((meta) => (
                  <li
                    key={meta.id}
                    className="flex items-start gap-2.5 rounded-lg p-2.5 bg-white/[0.03] border border-white/[0.05]"
                  >
                    <p className="flex-1 text-xs text-white/55 leading-relaxed">{meta.descricao}</p>
                    <div className="shrink-0 mt-0.5">
                      <MetaStatusBadge status={meta.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documentos — accordion aninhado */}
          <Accordion.Root type="single" collapsible className="rounded-lg border border-white/[0.06] overflow-hidden">
            <Accordion.Item value="docs" className="border-none">
              <Accordion.Trigger className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors group/docs">
                <FileText className="w-3.5 h-3.5 text-white/25 shrink-0" />
                <span className="flex-1 text-xs font-medium text-white/60">Documentos anexados nessa meta</span>
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#42b9eb]/10 border border-[#42b9eb]/20 text-[#42b9eb]">
                  {topico.documentosAprovados.length}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-white/25 transition-transform duration-200 group-data-[state=open]/docs:rotate-180 shrink-0" />
              </Accordion.Trigger>
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="px-3 pb-3 pt-1">
                  <DocumentosAnexados
                    documentos={topico.documentosAprovados}
                    topicoId={topico.id}
                  />
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

// ── PlanosSection ─────────────────────────────────────────────────────────────

export function PlanosSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpenTopico, setSheetOpenTopico] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MetaStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [docFilter, setDocFilter] = useState<"all" | "com" | "sem">("all");
  const [openTopicoIds, setOpenTopicoIds] = useState<string[]>([]);
  const [bulkToggling, setBulkToggling] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: temas, isLoading, isError } = useQuery({
    queryKey: ["temas"],
    queryFn: getTemas,
  });

  const selectedTema = temas?.find((t) => t.id === selectedId) ?? null;
  const sheetTema = temas?.find((t) => t.id === sheetId) ?? null;

  // Ref sempre com o dado mais recente, sem forçar o efeito abaixo a rodar
  // de novo a cada refetch em segundo plano (ex.: refetchOnWindowFocus do
  // React Query) — só queremos reagir quando o usuário troca de tema.
  const temasRef = useRef(temas);
  useEffect(() => {
    temasRef.current = temas;
  }, [temas]);

  // Abre a primeira Meta do tema automaticamente sempre que a seleção muda
  // (e só quando muda — não a cada refetch de "temas").
  useEffect(() => {
    const tema = temasRef.current?.find((t) => t.id === selectedId);
    setOpenTopicoIds(tema && tema.topicos.length > 0 ? [tema.topicos[0].id] : []);
  }, [selectedId]);

  const sortedTopicos = useMemo(() => {
    if (!selectedTema) return [];
    return [...selectedTema.topicos].sort(
      (a, b) => metaOrdinal(a.descricao) - metaOrdinal(b.descricao)
    );
  }, [selectedTema]);

  const areasDoTema = useMemo(
    () => Array.from(new Set(sortedTopicos.flatMap((t) => t.setorNomes))),
    [sortedTopicos]
  );
  const allTopicoIds = useMemo(() => sortedTopicos.map((t) => t.id), [sortedTopicos]);
  const allOpen = allTopicoIds.length > 0 && allTopicoIds.every((id) => openTopicoIds.includes(id));
  const anyFilterActive =
    Boolean(searchQuery.trim()) || statusFilter !== "all" || areaFilter !== "all" || docFilter !== "all";

  const todasMetasDoTema = useMemo(() => sortedTopicos.flatMap((t) => t.metas), [sortedTopicos]);
  const completed = useMemo(
    () => todasMetasDoTema.filter((m) => isCompletedMetaStatus(m.status)).length,
    [todasMetasDoTema]
  );
  const pct = todasMetasDoTema.length > 0 ? Math.round((completed / todasMetasDoTema.length) * 100) : 0;

  const totalTopicos = useMemo(() => (temas ?? []).reduce((acc, t) => acc + t.topicos.length, 0), [temas]);
  const totalMetas = useMemo(
    () => (temas ?? []).reduce((acc, t) => acc + t.topicos.reduce((a, tp) => a + tp.metas.length, 0), 0),
    [temas]
  );
  const totalDocs = useMemo(() => totalDocumentosDosTemas(temas ?? []), [temas]);
  const totalDocsDoTema = useMemo(
    () => (selectedTema ? totalDocumentosDoTema(selectedTema) : 0),
    [selectedTema]
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
            {/* Stats chips + download geral */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div className="flex flex-wrap gap-2">
                {[
                  `${temas.length} ${temas.length === 1 ? "tema" : "temas"}`,
                  `${totalTopicos} ${totalTopicos === 1 ? "meta" : "metas"}`,
                  `${totalMetas} ${totalMetas === 1 ? "objetivo" : "objetivos"}`,
                  `${totalDocs} ${totalDocs === 1 ? "documento" : "documentos"}`,
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

              <BotaoDownload
                url={urlDownloadTodosTemas()}
                label="Baixar todos os temas (ZIP)"
                disabled={totalDocs === 0}
                title={
                  totalDocs === 0
                    ? "Ainda não há documentos oficiais publicados"
                    : `Baixar os ${totalDocs} documentos oficiais de todos os temas em um único ZIP`
                }
                className="text-[11px] px-3 py-1.5"
              />
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
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAreaFilter("all");
                    setDocFilter("all");
                  }}
                  onOpenSheet={() => setSheetId(tema.id)}
                />
              ))}
            </div>

            {/* Painel da meta selecionada — accordion por Meta, sem sheet */}
            <AnimatePresence>
              {selectedId && selectedTema && (
                <motion.div
                  key="metas-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  {/* Header do tema selecionado */}
                  <div className="glass-panel p-8 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                          {selectedTema.nome.replace(/ \([^)]+\)$/, "")}
                        </h3>
                        <p className="text-muted-foreground">
                          {selectedTema.topicos[0]?.descricao ?? "—"}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-5">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <AnimatedCounter value={completed} className="text-3xl text-primary" />
                            <span className="text-muted-foreground text-lg">/</span>
                            <AnimatedCounter value={todasMetasDoTema.length} className="text-3xl text-foreground" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            objetivos &bull; {mounted ? `${pct}%` : "--%"} concluído
                          </span>
                        </div>

                        <BotaoDownload
                          url={urlDownloadTema(selectedTema.id)}
                          label="Baixar tema (ZIP)"
                          disabled={totalDocsDoTema === 0}
                          title={
                            totalDocsDoTema === 0
                              ? "Este tema ainda não possui documentos oficiais"
                              : `Baixar os ${totalDocsDoTema} documentos oficiais deste tema em ZIP`
                          }
                          className="text-[11px] px-3 py-1.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Busca + filtros */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar objetivo ou meta…"
                        className="w-full pl-8 pr-8 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/70 placeholder:text-white/20 focus:outline-none focus:border-[#42b9eb]/30 focus:bg-white/[0.06] transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as MetaStatus | "all")}>
                      <SelectTrigger className="h-9 w-auto min-w-[130px] text-xs gap-1.5 bg-white/[0.04] border-white/[0.08] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Status: Todos</SelectItem>
                        {META_STATUS_FILTER_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{getMetaStatusConfig(s).label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={areaFilter} onValueChange={setAreaFilter}>
                      <SelectTrigger className="h-9 w-auto min-w-[110px] text-xs gap-1.5 bg-white/[0.04] border-white/[0.08] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Área: Todas</SelectItem>
                        {areasDoTema.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={docFilter} onValueChange={(v) => setDocFilter(v as "all" | "com" | "sem")}>
                      <SelectTrigger className="h-9 w-auto min-w-[150px] text-xs gap-1.5 bg-white/[0.04] border-white/[0.08] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Documento: Todos</SelectItem>
                        <SelectItem value="com">Com documento</SelectItem>
                        <SelectItem value="sem">Sem documento</SelectItem>
                      </SelectContent>
                    </Select>

                    {anyFilterActive && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setAreaFilter("all");
                          setDocFilter("all");
                        }}
                        className="text-[11px] text-[#42b9eb]/60 hover:text-[#42b9eb] transition-colors underline underline-offset-2"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  {/* Cabeçalho da lista de metas + expandir/recolher tudo */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                      Metas do tema
                    </span>
                    <ExpandAllButton
                      allOpen={allOpen}
                      onClick={() => {
                        // Pula a animação de altura ao abrir/fechar várias de uma vez —
                        // evita o "tranco" de vários painéis animando juntos. Espera dois
                        // frames (o browser aplicar o novo layout) antes de reabilitar a
                        // animação — mais confiável do que um tempo fixo em ms.
                        setBulkToggling(true);
                        setOpenTopicoIds(allOpen ? [] : allTopicoIds);
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => setBulkToggling(false));
                        });
                      }}
                    />
                  </div>

                  {/* Accordion de Metas — substitui a tabela paginada e o sheet de tópicos */}
                  {sortedTopicos.length > 0 ? (
                    <Accordion.Root
                      type="multiple"
                      value={openTopicoIds}
                      onValueChange={setOpenTopicoIds}
                      className={`space-y-3 ${bulkToggling ? "accordion-bulk-toggle" : ""}`}
                    >
                      {sortedTopicos.map((topico) => (
                        <MetaTopicoAccordion
                          key={topico.id}
                          topico={topico}
                          filters={{ status: statusFilter, area: areaFilter, doc: docFilter, query: searchQuery }}
                        />
                      ))}
                    </Accordion.Root>
                  ) : (
                    <div className="glass-panel flex flex-col items-center justify-center py-12 gap-2">
                      <Search className="w-5 h-5 text-white/15" />
                      <p className="text-xs text-white/25">Nenhuma meta cadastrada para este tema.</p>
                    </div>
                  )}
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
