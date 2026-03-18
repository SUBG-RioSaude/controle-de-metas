"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Target, Clock, CheckCircle2, RotateCcw, AlertCircle, Loader2, Check, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetorAutocomplete } from "@/components/ui/SetorAutocomplete";
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

const META_STATUS_ENUM: Record<MetaStatus, number> = {
  NaoIniciada: 0,
  EmAndamento: 1,
  PendenteAprovacao: 2,
  Concluido: 3,
  AguardandoRetorno: 4,
};

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
        await api.patch(`/metas/${meta.id}/status`, { status: META_STATUS_ENUM[newStatus] });
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
        <div className="flex items-center gap-2 mt-2 flex-wrap relative">
          {/* Status selector */}
          {canChangeStatus && availableStatuses.length > 0 ? (
            <StatusSelector 
              current={status} 
              available={availableStatuses} 
              onSelect={handleStatusChange} 
              loading={loading} 
            />
          ) : (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StatusSelector Component ───────────────────────────────────────────────────

interface StatusSelectorProps {
  current: MetaStatus;
  available: MetaStatus[];
  onSelect: (s: MetaStatus) => void;
  loading: boolean;
}

function StatusSelector({ current, available, onSelect, loading }: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[current];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all ${cfg.color} ${
          open ? "ring-2 ring-primary/20" : ""
        }`}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : cfg.icon}
        {cfg.label}
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-2xl z-[100] py-1.5 overflow-hidden"
            >
              {[...available].map((s) => {
                const isSelected = current === s;
                const sCfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      onSelect(s);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                      isSelected ? "text-primary bg-primary/5" : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className={sCfg.color.split(" ")[1]}>{sCfg.icon}</span>
                      {sCfg.label}
                    </div>
                    {isSelected && <Check size={11} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TopicoCard ────────────────────────────────────────────────────────────────

interface TopicoCardProps {
  topico: Topico;
  onAddMeta: (topicoId: string) => void;
}

function TopicoCard({ topico, onAddMeta }: TopicoCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const done  = topico.metas.filter((m) => m.status === "Concluido").length;
  const total = topico.metas.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="border border-border/50 rounded-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((ex) => !ex); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
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
      </div>

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
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-wrap gap-1">
                  {topico.pontosFocais?.length > 0 && topico.pontosFocais.map((pf) => (
                    <span key={pf} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {pf}
                    </span>
                  ))}
                </div>
                {user?.role === "Admin" && (
                  <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => onAddMeta(topico.id)}>
                    <Plus size={12} />
                    Criar Meta
                  </Button>
                )}
              </div>
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
  const { user } = useAuth();
  const [temas, setTemas]   = useState<Tema[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New Theme state
  const [isTemaDialogOpen, setIsTemaDialogOpen] = useState(false);
  const [newTemaName, setNewTemaName] = useState("");
  const [isCreatingTema, setIsCreatingTema] = useState(false);

  // New Topic state
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState({ descricao: "", setorResponsavel: [] as string[], pontosFocais: "" });
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  // New Meta state
  const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
  const [selectedTopicoId, setSelectedTopicoId] = useState<string | null>(null);
  const [newMetaDesc, setNewMetaDesc] = useState("");
  const [isCreatingMeta, setIsCreatingMeta] = useState(false);

  const fetchTemas = async () => {
    try {
      const r = await api.get<{ success: boolean; data: Tema[] }>("/temas");
      setTemas(r.data.data);
    } catch {
      toast.error("Erro ao carregar os temas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemas();
  }, []);

  async function handleCreateTema() {
    if (!newTemaName.trim()) return;
    setIsCreatingTema(true);
    try {
      await api.post("/temas", { nome: newTemaName });
      toast.success("Tema criado com sucesso!");
      setIsTemaDialogOpen(false);
      setNewTemaName("");
      fetchTemas();
    } catch {
      toast.error("Erro ao criar o tema.");
    } finally {
      setIsCreatingTema(false);
    }
  }

  async function handleCreateTopic() {
    if (!selectedTemaId || !newTopic.descricao.trim()) return;
    setIsCreatingTopic(true);
    try {
      await api.post("/topicos", {
        temaId: selectedTemaId,
        descricao: newTopic.descricao,
        setorResponsavel: newTopic.setorResponsavel.join(","),
        pontosFocais: newTopic.pontosFocais.split(",").map(s => s.trim()).filter(Boolean)
      });
      toast.success("Tópico criado com sucesso!");
      setIsTopicDialogOpen(false);
      setNewTopic({ descricao: "", setorResponsavel: [], pontosFocais: "" });
      fetchTemas();
    } catch {
      toast.error("Erro ao criar o tópico.");
    } finally {
      setIsCreatingTopic(false);
    }
  }

  async function handleCreateMeta() {
    if (!selectedTopicoId || !newMetaDesc.trim()) return;
    setIsCreatingMeta(true);
    try {
      await api.post("/metas", {
        topicoId: selectedTopicoId,
        descricao: newMetaDesc
      });
      toast.success("Meta criada com sucesso!");
      setIsMetaDialogOpen(false);
      setNewMetaDesc("");
      fetchTemas();
    } catch {
      toast.error("Erro ao criar a meta.");
    } finally {
      setIsCreatingMeta(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Temas & Metas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Hierarquia: Tema → Tópico → Meta</p>
        </div>
        {user?.role === "Admin" && (
          <Button onClick={() => setIsTemaDialogOpen(true)} className="gap-2 text-white">
            <Plus size={16} />
            Novo Tema
          </Button>
        )}
      </div>

      {/* Create Tema Dialog */}
      <Dialog open={isTemaDialogOpen} onOpenChange={setIsTemaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Tema</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Tema</label>
              <Input 
                placeholder="Ex: Gestão das Contratações" 
                value={newTemaName}
                onChange={(e) => setNewTemaName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTema} disabled={isCreatingTema}>
              {isCreatingTema ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Criar Tema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Tópico</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input 
                placeholder="Ex: Promover medidas que reduzam..." 
                value={newTopic.descricao}
                onChange={(e) => setNewTopic({ ...newTopic, descricao: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor Responsável</label>
              <SetorAutocomplete
                value={newTopic.setorResponsavel}
                onChange={(v) => setNewTopic((prev) => ({ ...prev, setorResponsavel: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pontos Focais (separados por vírgula)</label>
              <Input 
                placeholder="Ex: João Silva, Maria Souza" 
                value={newTopic.pontosFocais}
                onChange={(e) => setNewTopic({ ...newTopic, pontosFocais: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTopic} disabled={isCreatingTopic}>
              {isCreatingTopic ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Criar Tópico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Meta Dialog */}
      <Dialog open={isMetaDialogOpen} onOpenChange={setIsMetaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição da Meta</label>
              <Input 
                placeholder="Ex: Diminuição dos valores empenhados..." 
                value={newMetaDesc}
                onChange={(e) => setNewMetaDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMetaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateMeta} disabled={isCreatingMeta}>
              {isCreatingMeta ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div key={tema.id} className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-sm relative">
            {/* Tema header */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpanded(isOpen ? null : tema.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(isOpen ? null : tema.id); }}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
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
                {user?.role === "Admin" && (
                  <>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-[11px] gap-1 px-3 border border-border/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemaId(tema.id);
                        setIsTopicDialogOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      Novo Tópico
                    </Button>
                    <div className="w-px h-8 bg-border/40 mx-1" />
                  </>
                )}
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
            </div>

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
                    {tema.topicos.map((t) => (
                      <TopicoCard 
                        key={t.id} 
                        topico={t} 
                        onAddMeta={(id) => {
                          setSelectedTopicoId(id);
                          setIsMetaDialogOpen(true);
                        }}
                      />
                    ))}
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
