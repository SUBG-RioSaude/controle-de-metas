"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Target, Clock, CheckCircle2, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type MetaStatus = "NaoIniciada" | "EmAndamento" | "PendenteAprovacao" | "Concluido" | "AguardandoRetorno";

interface Meta {
  id:          string;
  descricao:   string;
  status:      MetaStatus;
  createdAt?:  string;
  updatedAt?:  string;
}

interface Topico {
  id:               string;
  descricao:        string;
  setorResponsavel: string;
  pontosFocais:     string[];
  metas:            Meta[];
}

interface Tema {
  id:      string;
  nome:    string;
  topicos: Topico[];
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MetaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  NaoIniciada:        { label: "Não iniciada",       color: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",        icon: <AlertCircle size={11} /> },
  EmAndamento:        { label: "Em andamento",        color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20",  icon: <Clock size={11} /> },
  PendenteAprovacao:  { label: "Aguardando aprovação",color: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20", icon: <ChevronRight size={11} /> },
  Concluido:          { label: "Concluída",           color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20", icon: <CheckCircle2 size={11} /> },
  AguardandoRetorno:  { label: "Aguardando retorno",  color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20",        icon: <RotateCcw size={11} /> },
};

// Analyst can set these; Aprovador adds Concluido / AguardandoRetorno
const ANALISTA_STATUSES: MetaStatus[] = ["NaoIniciada", "EmAndamento", "PendenteAprovacao"];
const APROVADOR_STATUSES: MetaStatus[] = ["Concluido", "AguardandoRetorno"];

// ── MetaCard ──────────────────────────────────────────────────────────────────

function MetaCard({ meta }: { meta: Meta }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<MetaStatus>(meta.status);
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[status];

  const canChangeStatus =
    user?.role === "Admin" ||
    user?.role === "Analista" ||
    user?.role === "Aprovador";

  const availableStatuses: MetaStatus[] =
    user?.role === "Admin"
      ? [...ANALISTA_STATUSES, ...APROVADOR_STATUSES]
      : user?.role === "Aprovador"
      ? APROVADOR_STATUSES
      : user?.role === "Analista"
      ? ANALISTA_STATUSES
      : [];

  async function handleStatusChange(newStatus: MetaStatus) {
    if (newStatus === status) return;
    setLoading(true);
    try {
      await api.patch(`/metas/${meta.id}/status`, { status: newStatus });
      setStatus(newStatus);
      toast.success("Status atualizado com sucesso.");
    } catch {
      toast.error("Erro ao atualizar o status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-border/40 hover:border-primary/20 transition-colors">
      <Target size={14} className="text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{meta.descricao}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Status badge / selector */}
          {canChangeStatus && availableStatuses.length > 0 ? (
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as MetaStatus)}
              disabled={loading}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border cursor-pointer outline-none ${cfg.color}`}
            >
              {/* Show current status even if not in allowed list */}
              {!availableStatuses.includes(status) && (
                <option value={status} disabled>{STATUS_CONFIG[status].label}</option>
              )}
              {availableStatuses.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          ) : (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          )}
          {loading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}

// ── TopicoCard ────────────────────────────────────────────────────────────────

function TopicoCard({ topico }: { topico: Topico }) {
  const [expanded, setExpanded] = useState(false);
  const done  = topico.metas.filter((m) => m.status === "Concluido").length;
  const total = topico.metas.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{topico.descricao}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-muted-foreground">{topico.setorResponsavel}</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-primary font-medium">{done}/{total} concluídas</span>
          </div>
        </div>
        {/* Mini progress */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground w-7 text-right">{pct}%</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2">
              {topico.pontosFocais?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {topico.pontosFocais.map((pf) => (
                    <span key={pf} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {pf}
                    </span>
                  ))}
                </div>
              )}
              {topico.metas.map((meta) => <MetaCard key={meta.id} meta={meta} />)}
              {topico.metas.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma meta cadastrada.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TemasView (main) ──────────────────────────────────────────────────────────

export function TemasView() {
  const [temas, setTemas]   = useState<Tema[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: Tema[] }>("/temas")
      .then((r) => setTemas(r.data.data))
      .catch(() => toast.error("Erro ao carregar os temas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Temas & Metas</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Hierarquia: Tema → Tópico → Meta</p>
      </div>

      {temas.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum tema encontrado.</p>
      )}

      {temas.map((tema) => {
        const isOpen    = expanded === tema.id;
        const allMetas  = tema.topicos.flatMap((t) => t.metas);
        const done      = allMetas.filter((m) => m.status === "Concluido").length;
        const total     = allMetas.length;
        const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <div key={tema.id} className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {/* Tema header */}
            <button
              onClick={() => setExpanded(isOpen ? null : tema.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{tema.nome}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {tema.topicos.length} tópico{tema.topicos.length !== 1 ? "s" : ""} · {total} meta{total !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{pct}%</p>
                  <p className="text-[10px] text-muted-foreground">{done}/{total}</p>
                </div>
                <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </motion.div>
              </div>
            </button>

            {/* Tópicos */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border/40 pt-3">
                    {tema.topicos.map((t) => <TopicoCard key={t.id} topico={t} />)}
                    {tema.topicos.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum tópico cadastrado.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
