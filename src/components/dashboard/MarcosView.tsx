"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag, Plus, Pencil, Trash2, Loader2, X, CalendarDays, Users2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

type Responsavel = 0 | 1 | 2;

const RESPONSAVEL_LABEL: Record<Responsavel, string> = {
  0: "TCMRio",
  1: "CGMRio",
  2: "SMSRioSaúde",
};

const RESPONSAVEL_COLOR: Record<Responsavel, string> = {
  0: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/20",
  1: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20",
  2: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20",
};

interface Marco {
  id: number;
  etapa: string;
  responsaveis: Responsavel[];
  prazo: string; // ISO string
}

interface MarcoFormData {
  etapa: string;
  responsaveis: Responsavel[];
  prazo: string; // datetime-local value
}

const EMPTY_FORM: MarcoFormData = { etapa: "", responsaveis: [], prazo: "" };
const ALL_RESPONSAVEIS: Responsavel[] = [0, 1, 2];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isOverdue(prazo: string) {
  return new Date(prazo) < new Date();
}

// ── Modal ──────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  form: MarcoFormData;
  onChange: (form: MarcoFormData) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  confirmLabel: string;
}

function MarcoModal({ title, form, onChange, onConfirm, onClose, loading, confirmLabel }: ModalProps) {
  function toggleResponsavel(r: Responsavel) {
    const next = form.responsaveis.includes(r)
      ? form.responsaveis.filter((x) => x !== r)
      : [...form.responsaveis, r];
    onChange({ ...form, responsaveis: next });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Etapa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Etapa</label>
            <input
              value={form.etapa}
              onChange={(e) => onChange({ ...form, etapa: e.target.value })}
              placeholder="Descreva a etapa..."
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Prazo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prazo</label>
            <input
              type="datetime-local"
              value={form.prazo}
              onChange={(e) => onChange({ ...form, prazo: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Responsáveis */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Responsáveis</label>
            <div className="flex flex-wrap gap-2">
              {ALL_RESPONSAVEIS.map((r) => {
                const selected = form.responsaveis.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleResponsavel(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selected
                        ? RESPONSAVEL_COLOR[r]
                        : "bg-slate-100 text-muted-foreground border-slate-200 dark:bg-white/5 dark:border-white/10 hover:border-primary/40"
                    }`}
                  >
                    {RESPONSAVEL_LABEL[r]}
                  </button>
                );
              })}
            </div>
            {form.responsaveis.length === 0 && (
              <p className="text-[11px] text-amber-500">Selecione ao menos um responsável.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !form.etapa.trim() || !form.prazo || form.responsaveis.length === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function MarcosView() {
  const [marcos,     setMarcos]     = useState<Marco[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<Marco | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Marco | null>(null);

  const [form, setForm] = useState<MarcoFormData>(EMPTY_FORM);

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get<{ success: boolean; data: Marco[] }>("/marcos")
      .then((r) => setMarcos(r.data.data))
      .catch(() => toast.error("Erro ao carregar marcos."))
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function toIso(datetimeLocal: string) {
    // datetime-local gives "YYYY-MM-DDTHH:mm", convert to full ISO
    return new Date(datetimeLocal).toISOString();
  }

  function toDatetimeLocal(iso: string) {
    // Convert ISO to datetime-local format for the input
    return iso ? iso.slice(0, 16) : "";
  }

  // ── Create ───────────────────────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  async function handleCreate() {
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: Marco }>("/marcos", {
        etapa:        form.etapa,
        responsaveis: form.responsaveis,
        prazo:        toIso(form.prazo),
      });
      setMarcos((prev) => [...prev, res.data.data]);
      setCreateOpen(false);
      toast.success("Marco temporal criado com sucesso.");
    } catch {
      toast.error("Erro ao criar marco temporal.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  function openEdit(marco: Marco) {
    setForm({
      etapa:        marco.etapa,
      responsaveis: marco.responsaveis,
      prazo:        toDatetimeLocal(marco.prazo),
    });
    setEditTarget(marco);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await api.patch<{ success: boolean; data: Marco }>(`/marcos/${editTarget.id}`, {
        etapa:        form.etapa,
        responsaveis: form.responsaveis,
        prazo:        toIso(form.prazo),
      });
      setMarcos((prev) => prev.map((m) => m.id === editTarget.id ? res.data.data : m));
      setEditTarget(null);
      toast.success("Marco temporal atualizado.");
    } catch {
      toast.error("Erro ao atualizar marco temporal.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/marcos/${deleteTarget.id}`);
      setMarcos((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Marco temporal removido.");
    } catch {
      toast.error("Erro ao remover marco temporal.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const sorted = [...marcos].sort(
    (a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime()
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">Marcos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {marcos.length} marco{marcos.length !== 1 ? "s" : ""} cadastrado{marcos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={15} />
            Novo Marco
          </button>
        </div>

        {/* List */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Flag size={22} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum marco temporal cadastrado.</p>
            <p className="text-xs text-muted-foreground">Clique em &quot;Novo Marco&quot; para começar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {sorted.map((marco, i) => {
                const overdue = isOverdue(marco.prazo);
                return (
                  <motion.div
                    key={marco.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group"
                  >
                    {/* Timeline dot */}
                    <div className={`mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${
                      overdue
                        ? "bg-rose-400 border-rose-300"
                        : "bg-primary border-primary/40"
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{marco.etapa}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Prazo */}
                        <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          overdue
                            ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20"
                            : "bg-slate-50 text-muted-foreground border-border/50 dark:bg-white/5"
                        }`}>
                          <CalendarDays size={10} />
                          {formatDate(marco.prazo)}
                          {overdue && " · Vencido"}
                        </span>

                        {/* Responsáveis */}
                        {marco.responsaveis.map((r) => (
                          <span key={r} className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${RESPONSAVEL_COLOR[r]}`}>
                            <Users2 size={9} />
                            {RESPONSAVEL_LABEL[r]}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(marco)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(marco)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {createOpen && (
          <MarcoModal
            title="Novo Marco Temporal"
            form={form}
            onChange={setForm}
            onConfirm={handleCreate}
            onClose={() => setCreateOpen(false)}
            loading={submitting}
            confirmLabel="Criar Marco"
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editTarget && (
          <MarcoModal
            title="Editar Marco Temporal"
            form={form}
            onChange={setForm}
            onConfirm={handleEdit}
            onClose={() => setEditTarget(null)}
            loading={submitting}
            confirmLabel="Salvar Alterações"
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Remover marco?</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deleteTarget.etapa}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                  Remover
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
