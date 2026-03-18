"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Pencil, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Setor {
  id:        string;
  nome:      string;
  createdAt: string;
  updatedAt: string;
}

// ── Modal ──────────────────────────────────────────────────────────────────────

interface ModalProps {
  title:        string;
  nome:         string;
  onChange:     (nome: string) => void;
  onConfirm:    () => void;
  onClose:      () => void;
  loading:      boolean;
  confirmLabel: string;
}

function SetorModal({ title, nome, onChange, onConfirm, onClose, loading, confirmLabel }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-muted-foreground"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nome do Setor
          </label>
          <input
            value={nome}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && nome.trim()) onConfirm(); }}
            placeholder="Ex: Secretaria de Saúde"
            autoFocus
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !nome.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function SetoresView() {
  const [setores,    setSetores]    = useState<Setor[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search,     setSearch]     = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Setor | null>(null);
  const [nome,       setNome]       = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────────

  function fetchSetores() {
    api.get<{ success: boolean; data: Setor[] }>("/setores")
      .then((r) => setSetores(r.data.data))
      .catch(() => toast.error("Erro ao carregar setores."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchSetores(); }, []);

  // ── Create ───────────────────────────────────────────────────────────────────

  function openCreate() {
    setNome("");
    setCreateOpen(true);
  }

  async function handleCreate() {
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; data: Setor }>("/setores", { nome });
      setSetores((prev) => [...prev, res.data.data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCreateOpen(false);
      toast.success("Setor criado com sucesso.");
    } catch {
      toast.error("Erro ao criar setor.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  function openEdit(setor: Setor) {
    setNome(setor.nome);
    setEditTarget(setor);
  }

  async function handleEdit() {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await api.patch<{ success: boolean; data: Setor }>(`/setores/${editTarget.id}`, { nome });
      setSetores((prev) =>
        prev.map((s) => (s.id === editTarget.id ? res.data.data : s))
            .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setEditTarget(null);
      toast.success("Setor atualizado com sucesso.");
    } catch {
      toast.error("Erro ao atualizar setor.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const filtered = setores.filter((s) =>
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">Setores</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {setores.length} setor{setores.length !== 1 ? "es" : ""} cadastrado{setores.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar setor..."
                className="pl-9 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
              />
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={15} />
              Novo Setor
            </button>
          </div>
        </div>

        {/* Empty state */}
        {setores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 size={22} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum setor cadastrado.</p>
            <p className="text-xs text-muted-foreground">Clique em &quot;Novo Setor&quot; para começar.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-muted-foreground">Nenhum setor encontrado para &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence initial={false}>
              {filtered.map((setor, i) => (
                <motion.div
                  key={setor.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{setor.nome}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Atualizado em{" "}
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(setor.updatedAt))}
                    </p>
                  </div>

                  <button
                    onClick={() => openEdit(setor)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all shrink-0"
                    title="Editar setor"
                  >
                    <Pencil size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {createOpen && (
          <SetorModal
            title="Novo Setor"
            nome={nome}
            onChange={setNome}
            onConfirm={handleCreate}
            onClose={() => setCreateOpen(false)}
            loading={submitting}
            confirmLabel="Criar Setor"
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editTarget && (
          <SetorModal
            title="Editar Setor"
            nome={nome}
            onChange={setNome}
            onConfirm={handleEdit}
            onClose={() => setEditTarget(null)}
            loading={submitting}
            confirmLabel="Salvar Alterações"
          />
        )}
      </AnimatePresence>
    </>
  );
}
