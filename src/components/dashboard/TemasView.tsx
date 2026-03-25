"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Target, Clock, CheckCircle2, RotateCcw, AlertCircle, Loader2, Check, Plus, Radio, Paperclip, FileText, Trash2, Upload, ThumbsUp, ThumbsDown, RefreshCw, ExternalLink, History, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetorAutocomplete } from "@/components/ui/SetorAutocomplete";
import { toast } from "sonner";
import { useMetaHub, MetaStatus as LiveMetaStatus, TopicoDocumentoPayload, TopicoDocumentoRemovedPayload, MetaStatusLoggedPayload, TopicoDocumentLoggedPayload, UserRoleLoggedPayload } from "@/hooks/useMetaHub";
import { Textarea } from "@/components/ui/textarea";

// ── Types ─────────────────────────────────────────────────────────────────────

type MetaStatus = "NaoIniciada" | "EmAndamento" | "PendenteAprovacao" | "Concluido" | "AguardandoRetorno";

interface Meta {
  id:               string;
  descricao:        string;
  status:           MetaStatus;
  approvedByUserId: string | null;
  approvedAt:       string | null;
  createdAt?:       string;
  updatedAt?:       string;
}

type DocumentoStatus = "PendenteAprovacao" | "Aprovado" | "Devolvido";
type DocumentoAcao   = "Upload" | "Aprovado" | "Devolvido" | "Reenvio";

interface MetaStatusLog {
  id:            string;
  statusAnterior: string;
  statusNovo:    string;
  criadoEm:      string;
  userNome:      string;
  userEmail:     string;
}

interface DocumentoLog {
  id:        string;
  acao:      string;   // matches useMetaHub export
  detalhes?: string;
  criadoEm:  string;
  userNome:  string;
  userEmail: string;
}

interface TopicoDocumento {
  id:                  string;
  topicoId:            string;
  nome:                string;
  driveUrl:            string;
  driveOficialUrl?:    string;
  uploadedAt:          string;
  uploadedByUserId:    string;
  status:              DocumentoStatus;
  comentarioAprovacao?: string;
}

interface Topico {
  id:           string;
  descricao:    string;
  setorId:      string | null;
  setorNome:    string | null;
  pontosFocais: string[];
  metas:        Meta[];
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

function MetaCard({ meta, liveStatus, liveLog }: { meta: Meta; liveStatus?: MetaStatus; liveLog?: MetaStatusLog }) {
  const { user } = useAuth();
  const [status, setStatus]           = useState<MetaStatus>(meta.status);
  const [loading, setLoading]         = useState(false);
  const [logsOpen, setLogsOpen]       = useState(false);
  const [logs, setLogs]               = useState<MetaStatusLog[] | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const canViewHistory = user?.role === "Admin" || user?.role === "Aprovador";

  // Append live log when SignalR pushes a new entry
  useEffect(() => {
    if (!liveLog) return;
    setLogs((prev) => prev ? [liveLog, ...prev.filter(l => l.id !== liveLog.id)] : [liveLog]);
  }, [liveLog]);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    if (liveStatus && liveStatus !== status) setStatus(liveStatus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatus]);

  const canChangeStatus =
    user?.role === "Admin" || user?.role === "Analista" || user?.role === "Aprovador";

  const availableStatuses: MetaStatus[] =
    user?.role === "Admin"
      ? [...ANALISTA_STATUSES, ...APROVADOR_STATUSES]
      : user?.role === "Aprovador" ? APROVADOR_STATUSES
      : user?.role === "Analista"  ? ANALISTA_STATUSES : [];

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

  async function handleToggleLogs() {
    setLogsOpen((v) => !v);
    if (logs !== null) return;
    setLogsLoading(true);
    try {
      const r = await api.get<{ data: MetaStatusLog[] }>(`/metas/${meta.id}/logs`);
      setLogs(r.data.data);
    } catch { setLogs([]); }
    finally { setLogsLoading(false); }
  }

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-border/40 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3 p-3">
        <Target size={14} className="text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">{meta.descricao}</p>
          {(status === "Concluido" || status === "AguardandoRetorno") && meta.approvedAt && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {status === "Concluido" ? "Aprovado" : "Devolvido"} em{" "}
              {new Date(meta.approvedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap relative">
            {canChangeStatus && availableStatuses.length > 0 ? (
              <StatusSelector current={status} available={availableStatuses} onSelect={handleStatusChange} loading={loading} />
            ) : (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                {cfg.icon}{cfg.label}
              </span>
            )}
            {canViewHistory && (
              <button
                onClick={handleToggleLogs}
                className={`ml-auto inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-colors ${
                  logsOpen ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground border-border/40 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {logsLoading ? <Loader2 size={9} className="animate-spin" /> : <History size={9} />}
                Histórico
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {logsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border/30 pt-2 flex flex-col gap-1.5 ml-5">
              {logsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-1">
                  <Loader2 size={12} className="animate-spin" /><span className="text-[11px]">Carregando...</span>
                </div>
              ) : (logs ?? []).length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Nenhuma movimentação registrada.</p>
              ) : (
                (logs ?? []).map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0 text-[11px]">
                      <span className="text-muted-foreground">{STATUS_CONFIG[log.statusAnterior as MetaStatus]?.label ?? log.statusAnterior}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-semibold text-foreground">{STATUS_CONFIG[log.statusNovo as MetaStatus]?.label ?? log.statusNovo}</span>
                      <span className="text-muted-foreground"> por </span>
                      <span className="font-medium text-foreground">{log.userNome}</span>
                      <span className="text-muted-foreground"> &lt;{log.userEmail}&gt;</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">
                        {new Date(log.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  topico:            Topico;
  onAddMeta:         (topicoId: string) => void;
  onTopicUpdated?:   () => void;
  liveStatuses:      Map<string, MetaStatus>;
  documents:         TopicoDocumento[];
  onDocumentsChange: (topicoId: string, docs: TopicoDocumento[]) => void;
  liveDocLogs:       Map<string, DocumentoLog>;
  liveMetaLogs:      Map<string, MetaStatusLog>;
}

function TopicoCard({ topico, onAddMeta, onTopicUpdated, liveStatuses, documents, onDocumentsChange, liveDocLogs, liveMetaLogs }: TopicoCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded]         = useState(false);
  const [hasFetched, setHasFetched]     = useState(false);
  const [docLoading, setDocLoading]     = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [draggedFile, setDraggedFile]   = useState<File | null>(null);

  // Edit topico state
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [editForm, setEditForm]         = useState({ descricao: "", setorId: null as string | null, pontosFocais: "", nomePastaDrive: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Return modal state
  const [returnDocId, setReturnDocId]   = useState<string | null>(null);
  const [returnComment, setReturnComment] = useState("");
  const [isReturning, setIsReturning]   = useState(false);
  
  // Specific loading states for actions
  const [approvingId, setApprovingId]     = useState<string | null>(null);
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  // Logs per document
  const [docLogs, setDocLogs]             = useState<Map<string, DocumentoLog[]>>(new Map());
  const [logsOpenId, setLogsOpenId]       = useState<string | null>(null);
  const [logsLoadingId, setLogsLoadingId] = useState<string | null>(null);

  // Reupload input ref per doc
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const reuploadDocIdRef = useRef<string | null>(null);

  const done  = topico.metas.filter((m) => m.status === "Concluido").length;
  const total = topico.metas.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  const isApprover     = user?.role === "Admin" || user?.role === "Aprovador";
  const canUpload      = user?.role === "Admin" || user?.role === "Analista" || user?.role === "Aprovador";
  const canViewHistory = user?.role === "Admin" || user?.role === "Aprovador";

  const canDelete = (doc: TopicoDocumento) => {
    if (user?.role === "Admin") return true;
    if (doc.status === "Aprovado") return false;
    return doc.uploadedByUserId === user?.userId;
  };

  const canReupload = (doc: TopicoDocumento) =>
    doc.status === "Devolvido" &&
    (user?.role === "Admin" || doc.uploadedByUserId === user?.userId);

  // Lazy-fetch documents on first expand
  useEffect(() => {
    if (!expanded || hasFetched) return;
    setHasFetched(true);
    setDocLoading(true);
    api.get<{ data: TopicoDocumento[] }>(`/topicos/${topico.id}/documents`)
      .then((r) => onDocumentsChange(topico.id, r.data.data))
      .catch(() => {})
      .finally(() => setDocLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setDraggedFile(null);
    if (!expanded) setExpanded(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const r = await api.post<{ data: TopicoDocumento }>(
        `/topicos/${topico.id}/documents`, formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onDocumentsChange(topico.id, [r.data.data, ...documents]);
      toast.success("Documento enviado! Aguardando aprovação.");
    } catch {
      toast.error("Erro ao enviar o documento.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleReuploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const docId = reuploadDocIdRef.current;
    if (!file || !docId) return;
    setReuploadingId(docId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const r = await api.put<{ data: TopicoDocumento }>(
        `/topicos/${topico.id}/documents/${docId}`, formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onDocumentsChange(topico.id, documents.map((d) => d.id === docId ? r.data.data : d));
      toast.success("Documento reenviado! Aguardando nova aprovação.");
    } catch {
      toast.error("Erro ao reenviar o documento.");
    } finally {
      setReuploadingId(null);
      if (reuploadInputRef.current) reuploadInputRef.current.value = "";
    }
  }

  async function handleApprove(docId: string) {
    setApprovingId(docId);
    try {
      const r = await api.post<{ data: TopicoDocumento }>(
        `/topicos/${topico.id}/documents/${docId}/approve`, {}
      );
      onDocumentsChange(topico.id, documents.map((d) => d.id === docId ? r.data.data : d));
      toast.success("Documento aprovado e movido para o Drive oficial!");
    } catch {
      toast.error("Erro ao aprovar o documento.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReturn() {
    if (!returnDocId || !returnComment.trim()) return;
    setIsReturning(true);
    try {
      const r = await api.post<{ data: TopicoDocumento }>(
        `/topicos/${topico.id}/documents/${returnDocId}/return`,
        { comentario: returnComment }
      );
      onDocumentsChange(topico.id, documents.map((d) => d.id === returnDocId ? r.data.data : d));
      toast.success("Documento devolvido para correção.");
      setReturnDocId(null);
      setReturnComment("");
    } catch {
      toast.error("Erro ao devolver o documento.");
    } finally {
      setIsReturning(false);
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      await api.delete(`/topicos/${topico.id}/documents/${docId}`);
      onDocumentsChange(topico.id, documents.filter((d) => d.id !== docId));
      toast.success("Documento removido.");
    } catch {
      toast.error("Erro ao remover o documento.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveEdit() {
    if (!editForm.descricao.trim()) return;
    setIsSavingEdit(true);
    try {
      await api.patch(`/topicos/${topico.id}`, {
        descricao:      editForm.descricao,
        setorId:        editForm.setorId || null,
        pontosFocais:   editForm.pontosFocais.split(",").map((s) => s.trim()).filter(Boolean),
        nomePastaDrive: editForm.nomePastaDrive.trim() || null,
      });
      toast.success("Meta atualizada com sucesso!");
      setIsEditOpen(false);
      onTopicUpdated?.();
    } catch {
      toast.error("Erro ao atualizar a meta.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Append live log entries pushed via SignalR
  useEffect(() => {
    liveDocLogs.forEach((log, docId) => {
      setDocLogs((prev) => {
        if (!prev.has(docId)) return prev; // só atualiza se já carregado
        const existing = prev.get(docId)!;
        if (existing.find(l => l.id === log.id)) return prev;
        return new Map(prev).set(docId, [log, ...existing]);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveDocLogs]);

  async function handleToggleLogs(docId: string) {
    if (logsOpenId === docId) { setLogsOpenId(null); return; }
    setLogsOpenId(docId);
    if (docLogs.has(docId)) return; // já carregados
    setLogsLoadingId(docId);
    try {
      const r = await api.get<{ data: DocumentoLog[] }>(`/topicos/${topico.id}/documents/${docId}/logs`);
      setDocLogs((prev) => new Map(prev).set(docId, r.data.data));
    } catch { /* silently ignore */ }
    finally { setLogsLoadingId(null); }
  }

  const DOC_STATUS: Record<DocumentoStatus, { label: string; color: string }> = {
    PendenteAprovacao: { label: "Aguardando aprovação", color: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20" },
    Aprovado:          { label: "Aprovado",             color: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20" },
    Devolvido:         { label: "Devolvido",            color: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20" },
  };

  return (
    <>
      {/* Modal confirm upload dnd */}
      <Dialog open={!!draggedFile} onOpenChange={(o) => { if (!o) setDraggedFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Upload</DialogTitle></DialogHeader>
          <div className="py-4 flex flex-col gap-3">
            <p className="text-sm text-foreground">
              Confirme os dados do documento que será enviado:
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-border/50 rounded-lg p-3 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arquivo</span>
                <p className="text-xs font-semibold text-foreground break-all line-clamp-2 mt-0.5" title={draggedFile?.name}>
                  {draggedFile?.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Etapa Destino</span>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={topico.descricao}>
                  {topico.descricao}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraggedFile(null)} disabled={isUploading}>Cancelar</Button>
            <Button onClick={() => { if (draggedFile) uploadFile(draggedFile); }} disabled={isUploading}>
              {isUploading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal edição de meta (tópico) */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { if (!o) setIsEditOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input
                value={editForm.descricao}
                onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor Responsável</label>
              <SetorAutocomplete
                value={editForm.setorId}
                onChange={(v) => setEditForm((f) => ({ ...f, setorId: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pontos Focais (separados por vírgula)</label>
              <Input
                placeholder="Ex: João Silva, Maria Souza"
                value={editForm.pontosFocais}
                onChange={(e) => setEditForm((f) => ({ ...f, pontosFocais: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome da pasta no Drive <span className="normal-case font-normal text-muted-foreground/70">(opcional)</span>
              </label>
              <Input
                placeholder="Deixe em branco para manter o atual"
                value={editForm.nomePastaDrive}
                onChange={(e) => setEditForm((f) => ({ ...f, nomePastaDrive: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit || !editForm.descricao.trim()}>
              {isSavingEdit ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal devolução */}
      <Dialog open={!!returnDocId} onOpenChange={(o) => { if (!o) { setReturnDocId(null); setReturnComment(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Devolver documento para correção</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo (obrigatório)</label>
            <Textarea
              placeholder="Descreva o que precisa ser corrigido..."
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnDocId(null); setReturnComment(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReturn} disabled={isReturning || !returnComment.trim()}>
              {isReturning ? <Loader2 size={14} className="animate-spin mr-2" /> : <ThumbsDown size={14} className="mr-2" />}
              Devolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div 
        className={`border border-border/50 rounded-xl relative overflow-hidden transition-all duration-300 ${
           isDragging ? "ring-2 ring-primary border-primary shadow-lg scale-[1.01]" : ""
        }`}
        onDragOver={(e) => { e.preventDefault(); if (canUpload && !isDragging) setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); if(!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!canUpload) return;
          const file = e.dataTransfer.files?.[0];
          if (file) setDraggedFile(file);
        }}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/5 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            {expanded ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-primary p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
                   <Upload size={24} className="text-primary" />
                 </div>
                 <div className="text-center">
                   <p className="text-sm font-bold text-primary">Solte o arquivo aqui</p>
                   <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-[250px]">Etapa: {topico.descricao}</p>
                 </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 w-[min(90%,400px)]">
                 <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center animate-bounce shrink-0">
                   <Upload size={18} className="text-primary" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-[13px] font-bold text-primary">Solte o arquivo aqui</p>
                   <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={topico.descricao}>Etapa: {topico.descricao}</p>
                 </div>
              </div>
            )}
          </div>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((e) => !e)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((ex) => !ex); }}
          className="w-full flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="mt-0.5 sm:mt-0 shrink-0">
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{topico.descricao}</p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                <span className="text-[11px] text-muted-foreground max-w-[140px] sm:max-w-none truncate">{topico.setorNome ?? "—"}</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">·</span>
                <span className="text-[11px] text-primary font-medium hidden sm:inline">{done}/{total} concluídas</span>
                {documents.length > 0 && (
                  <>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Paperclip size={10} />{documents.length} doc{documents.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-7 sm:pl-0 mt-1 sm:mt-0">
            <span className="text-[11px] text-primary font-medium sm:hidden">{done}/{total} conc.</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden hidden sm:block">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground w-7 text-right">{pct}%</span>
            </div>
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
                      <span key={pf} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{pf}</span>
                    ))}
                  </div>
                  {user?.role === "Admin" && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar meta"
                        onClick={() => {
                          setEditForm({ descricao: topico.descricao, setorId: topico.setorId, pontosFocais: topico.pontosFocais.join(", "), nomePastaDrive: "" });
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => onAddMeta(topico.id)}>
                        <Plus size={12} />Criar Objetivo
                      </Button>
                    </div>
                  )}
                </div>
                {[...topico.metas].sort((a, b) => a.descricao.localeCompare(b.descricao)).map((meta) => (
                  <MetaCard key={meta.id} meta={meta} liveStatus={liveStatuses.get(meta.id)} liveLog={liveMetaLogs?.get(meta.id)} />
                ))}
                {topico.metas.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhuma etapa cadastrada.</p>
                )}

                {/* ── Documentos ──────────────────────────────────────────── */}
                <div className="mt-4 bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-border/40 p-3">
                  <div className="flex items-center justify-between mb-3 pl-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Paperclip size={12} />Documentos Anexados
                    </span>
                    {canUpload && (
                      <>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 text-[10px] gap-1.5 px-3 bg-white dark:bg-slate-900 border border-border/50 hover:bg-slate-100 dark:hover:bg-white/5 shadow-sm rounded-lg"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {isUploading ? <Loader2 size={12} className="animate-spin text-primary" /> : <Upload size={12} className="text-primary" />}
                          <span className="font-semibold">{isUploading ? "Enviando..." : "Anexar arquivo"}</span>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Hidden reupload input */}
                  <input ref={reuploadInputRef} type="file" className="hidden" onChange={handleReuploadChange} />

                  {docLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                      <Loader2 size={14} className="animate-spin text-primary/60" />
                      <span className="text-xs font-medium">Buscando documentos...</span>
                    </div>
                  ) : documents.length === 0 && !isUploading ? (
                    <div className="flex flex-col items-center justify-center py-6 border border-dashed border-border/60 rounded-xl bg-white/50 dark:bg-slate-950/20">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <Paperclip size={14} className="text-muted-foreground/60" />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">Nenhum documento anexado a esta etapa.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {isUploading && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-primary/40 p-3 flex items-center gap-3 animate-pulse">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                             <Loader2 size={14} className="text-primary animate-spin" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[12px] font-semibold text-primary">Enviando documento...</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">Aguarde o final do processo.</p>
                          </div>
                        </div>
                      )}
                      {documents.map((doc) => {
                        const st = DOC_STATUS[doc.status];
                        return (
                          <div key={doc.id} className="rounded-xl bg-white dark:bg-slate-950 border border-border/50 p-3 flex flex-col gap-2">
                            {/* Row 1: icon + name + status badge */}
                            <div className="flex items-start sm:items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText size={14} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                                <div className="min-w-0">
                                  <a
                                    href={doc.status === "Aprovado" ? (doc.driveOficialUrl ?? doc.driveUrl) : doc.driveUrl}
                                    target="_blank" rel="noopener noreferrer"
                                    className="block text-[12px] font-semibold text-foreground hover:text-primary transition-colors truncate"
                                  >
                                    {doc.nome}
                                  </a>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mt-0.5 sm:mt-0">
                                    {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                                <span className={`self-start sm:self-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                                  {st.label}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: rejection comment */}
                            {doc.status === "Devolvido" && doc.comentarioAprovacao && (
                              <div className="ml-11 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Motivo da devolução:</p>
                                <p className="text-[11px] text-rose-600 dark:text-rose-300 mt-0.5">{doc.comentarioAprovacao}</p>
                              </div>
                            )}

                            {/* Row 3: official link for approved */}
                            {doc.status === "Aprovado" && doc.driveOficialUrl && (
                              <div className="ml-11">
                                <a
                                  href={doc.driveOficialUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                                >
                                  <ExternalLink size={10} />Ver no Drive oficial
                                </a>
                              </div>
                            )}

                            {/* Row 4: action buttons + histórico */}
                            <div className="ml-11 flex items-center gap-2 flex-wrap mt-1">
                              {/* Approve + Return — Aprovador/Admin on pending docs */}
                              {isApprover && doc.status === "PendenteAprovacao" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(doc.id)}
                                    disabled={approvingId === doc.id || isReturning || reuploadingId !== null || deletingId !== null}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {approvingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() => setReturnDocId(doc.id)}
                                    disabled={approvingId === doc.id || isReturning || reuploadingId !== null || deletingId !== null}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <ThumbsDown size={12} />Devolver
                                  </button>
                                </>
                              )}

                              {/* Reupload — uploader or Admin on rejected docs */}
                              {canReupload(doc) && (
                                <button
                                  onClick={() => { reuploadDocIdRef.current = doc.id; reuploadInputRef.current?.click(); }}
                                  disabled={reuploadingId === doc.id || approvingId !== null || isReturning || deletingId !== null}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {reuploadingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                  Reenviar
                                </button>
                              )}

                              {/* Delete */}
                              {canDelete(doc) && (
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  disabled={deletingId === doc.id || reuploadingId !== null || approvingId !== null || isReturning}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deletingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                  Excluir
                                </button>
                              )}

                              {/* Histórico — Admin/Aprovador only */}
                              {canViewHistory && <button
                                onClick={() => handleToggleLogs(doc.id)}
                                className={`ml-auto inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                                  logsOpenId === doc.id
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-transparent text-muted-foreground border-border/40 hover:bg-slate-50 dark:hover:bg-white/5"
                                }`}
                              >
                                {logsLoadingId === doc.id
                                  ? <Loader2 size={10} className="animate-spin" />
                                  : <History size={10} />
                                }
                                Histórico
                              </button>}
                            </div>

                            {/* Seção de histórico expandida */}
                            <AnimatePresence>
                              {logsOpenId === doc.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-11 mt-2 border-t border-border/30 pt-2 flex flex-col gap-1.5">
                                    {logsLoadingId === doc.id ? (
                                      <div className="flex items-center gap-2 text-muted-foreground py-1">
                                        <Loader2 size={12} className="animate-spin" />
                                        <span className="text-[11px]">Carregando histórico...</span>
                                      </div>
                                    ) : (docLogs.get(doc.id) ?? []).length === 0 ? (
                                      <p className="text-[11px] text-muted-foreground">Nenhuma movimentação registrada.</p>
                                    ) : (
                                      (docLogs.get(doc.id) ?? []).map((log) => {
                                        const ACAO_CONFIG: Record<DocumentoAcao, { label: string; color: string }> = {
                                          Upload:   { label: "Upload",   color: "text-primary" },
                                          Aprovado: { label: "Aprovado", color: "text-emerald-600 dark:text-emerald-400" },
                                          Devolvido:{ label: "Devolvido",color: "text-rose-600 dark:text-rose-400" },
                                          Reenvio:  { label: "Reenvio",  color: "text-amber-600 dark:text-amber-400" },
                                        };
                                        const cfg = ACAO_CONFIG[log.acao] ?? { label: log.acao, color: "text-foreground" };
                                        return (
                                          <div key={log.id} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-border mt-1.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                              <span className="text-[11px] text-muted-foreground"> por </span>
                                              <span className="text-[11px] font-medium text-foreground">{log.userNome}</span>
                                              <span className="text-[11px] text-muted-foreground"> &lt;{log.userEmail}&gt;</span>
                                              <span className="text-[10px] text-muted-foreground ml-2">
                                                {new Date(log.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                                              </span>
                                              {log.detalhes && (
                                                <p className="text-[11px] text-muted-foreground mt-0.5 italic">&quot;{log.detalhes}&quot;</p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}


// ── TemasView (main) ──────────────────────────────────────────────────────────

export function TemasView() {
  const { user } = useAuth();
  const [temas, setTemas]       = useState<Tema[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liveStatuses, setLiveStatuses]       = useState<Map<string, MetaStatus>>(new Map());
  const [topicoDocumentos, setTopicoDocumentos] = useState<Map<string, TopicoDocumento[]>>(new Map());
  const [hubConnected, setHubConnected] = useState(false);

  // New Theme state
  const [isTemaDialogOpen, setIsTemaDialogOpen] = useState(false);
  const [newTemaName, setNewTemaName] = useState("");
  const [isCreatingTema, setIsCreatingTema] = useState(false);

  // Edit Theme state
  const [editTema, setEditTema]           = useState<Tema | null>(null);
  const [editTemaName, setEditTemaName]   = useState("");
  const [isSavingTema, setIsSavingTema]   = useState(false);

  // New Topic state
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState({ descricao: "", setorId: null as string | null, pontosFocais: "", nomePastaDrive: "" });
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  // New Meta state
  const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
  const [selectedTopicoId, setSelectedTopicoId] = useState<string | null>(null);
  const [newMetaDesc, setNewMetaDesc] = useState("");
  const [isCreatingMeta, setIsCreatingMeta] = useState(false);

  // ── SignalR: real-time meta updates ──────────────────────────────────────────
  const handleMetaStatusChanged = useCallback(
    ({ metaId, status }: { metaId: string; topicoId: string; status: MetaStatus }) => {
      setLiveStatuses((prev) => new Map(prev).set(metaId, status));
      setHubConnected(true);
    },
    []
  );

  const handleMetaCreated = useCallback(() => {
    fetchTemasRef.current?.();
    setHubConnected(true);
  }, []);

  const handleTopicoDocumentAdded = useCallback((payload: TopicoDocumentoPayload) => {
    setTopicoDocumentos((prev) => {
      const next = new Map(prev);
      const existing = next.get(payload.topicoId) ?? [];
      if (!existing.find((d) => d.id === payload.id)) {
        next.set(payload.topicoId, [payload as TopicoDocumento, ...existing]);
      }
      return next;
    });
    setHubConnected(true);
  }, []);

  const handleTopicoDocumentRemoved = useCallback((payload: TopicoDocumentoRemovedPayload) => {
    setTopicoDocumentos((prev) => {
      const next = new Map(prev);
      const existing = next.get(payload.topicoId) ?? [];
      next.set(payload.topicoId, existing.filter((d) => d.id !== payload.docId));
      return next;
    });
  }, []);

  const handleTopicoDocumentUpdated = useCallback((payload: TopicoDocumentoPayload) => {
    setTopicoDocumentos((prev) => {
      const next = new Map(prev);
      const existing = next.get(payload.topicoId) ?? [];
      next.set(payload.topicoId, existing.map((d) => d.id === payload.id ? payload as TopicoDocumento : d));
      return next;
    });
  }, []);

  // Live log entries pushed via SignalR
  const [liveMetaLogs, setLiveMetaLogs]   = useState<Map<string, MetaStatusLog>>(new Map());
  const [liveDocLogs,  setLiveDocLogs]    = useState<Map<string, DocumentoLog>>(new Map());

  const handleMetaStatusLogged = useCallback((payload: MetaStatusLoggedPayload) => {
    setLiveMetaLogs((prev) => new Map(prev).set(payload.metaId, payload.log));
  }, []);

  const handleTopicoDocumentLogged = useCallback((payload: TopicoDocumentLoggedPayload) => {
    setLiveDocLogs((prev) => new Map(prev).set(payload.docId, payload.log));
  }, []);

  useMetaHub({
    onMetaStatusChanged:      handleMetaStatusChanged,
    onMetaCreated:            handleMetaCreated,
    onTopicoDocumentAdded:    handleTopicoDocumentAdded,
    onTopicoDocumentRemoved:  handleTopicoDocumentRemoved,
    onTopicoDocumentUpdated:  handleTopicoDocumentUpdated,
    onMetaStatusLogged:       handleMetaStatusLogged,
    onTopicoDocumentLogged:   handleTopicoDocumentLogged,
  });
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchTemasRef = useRef<(() => void) | null>(null);

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

  const handleDocumentsChange = useCallback((topicoId: string, docs: TopicoDocumento[]) => {
    setTopicoDocumentos((prev) => new Map(prev).set(topicoId, docs));
  }, []);

  // Keep ref current so the SignalR callback always calls the latest version
  fetchTemasRef.current = fetchTemas;

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchTemas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleSaveTema() {
    if (!editTema || !editTemaName.trim()) return;
    setIsSavingTema(true);
    try {
      await api.patch(`/temas/${editTema.id}`, { nome: editTemaName });
      toast.success("Tema atualizado com sucesso!");
      setEditTema(null);
      fetchTemas();
    } catch {
      toast.error("Erro ao atualizar o tema.");
    } finally {
      setIsSavingTema(false);
    }
  }

  async function handleCreateTopic() {
    if (!selectedTemaId || !newTopic.descricao.trim()) return;
    setIsCreatingTopic(true);
    try {
      await api.post("/topicos", {
        temaId: selectedTemaId,
        descricao: newTopic.descricao,
        setorId: newTopic.setorId,
        pontosFocais: newTopic.pontosFocais.split(",").map(s => s.trim()).filter(Boolean),
        nomePastaDrive: newTopic.nomePastaDrive.trim() || null,
      });
      toast.success("Meta criada com sucesso!");
      setIsTopicDialogOpen(false);
      setNewTopic({ descricao: "", setorId: null, pontosFocais: "", nomePastaDrive: "" });
      fetchTemas();
    } catch {
      toast.error("Erro ao criar a meta.");
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Temas & Metas</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Hierarquia: Tema → Metas → Objetivo</p>
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

      {/* Edit Tema Dialog */}
      <Dialog open={!!editTema} onOpenChange={(o) => { if (!o) setEditTema(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Tema</label>
              <Input
                value={editTemaName}
                onChange={(e) => setEditTemaName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveTema(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTema(null)}>Cancelar</Button>
            <Button onClick={handleSaveTema} disabled={isSavingTema || !editTemaName.trim()}>
              {isSavingTema ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
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
                value={newTopic.setorId}
                onChange={(v) => setNewTopic((prev) => ({ ...prev, setorId: v }))}
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome da pasta no Drive <span className="normal-case font-normal text-muted-foreground/70">(opcional)</span>
              </label>
              <Input
                placeholder="Ex: Contratações 2025 (deixe em branco para usar a descrição)"
                value={newTopic.nomePastaDrive}
                onChange={(e) => setNewTopic({ ...newTopic, nomePastaDrive: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTopic} disabled={isCreatingTopic}>
              {isCreatingTopic ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
              Criar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Meta Dialog */}
      <Dialog open={isMetaDialogOpen} onOpenChange={setIsMetaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Objetivo</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição do Objetivo</label>
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
              Criar Objetivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {temas.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum tema encontrado.</p>
      )}

      {[...temas].sort((a, b) => a.nome.localeCompare(b.nome)).map((tema) => {
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
              className="w-full flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Target size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight">{tema.nome}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {tema.topicos.length} meta{tema.topicos.length !== 1 ? "s" : ""} · {total} objetivo{total !== 1 ? "s" : ""}
                  </p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="sm:hidden shrink-0 mt-1">
                  <ChevronDown size={16} className="text-muted-foreground" />
                </motion.div>
              </div>

              <div className="flex items-center gap-3 sm:shrink-0 justify-between sm:justify-end mt-1 sm:mt-0 pl-12 sm:pl-0">
                {user?.role === "Admin" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground border border-border/40"
                      title="Editar tema"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTema(tema);
                        setEditTemaName(tema.nome);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
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
                      <span className="hidden sm:inline">Nova Meta</span>
                      <span className="sm:hidden">Meta</span>
                    </Button>
                    <div className="w-px h-8 bg-border/40 mx-1 hidden sm:block" />
                  </>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-right flex items-center gap-2 sm:block">
                    <p className="text-sm font-bold text-foreground">{pct}%</p>
                    <p className="text-[10px] text-muted-foreground hidden sm:block">{done}/{total}</p>
                  </div>
                  <div className="w-16 md:w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="hidden sm:block">
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </motion.div>
                </div>
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
                    {[...tema.topicos].sort((a, b) => {
                        const n = (s: string) => { const m = s.match(/Etapa\s+(\d+)/i); return m ? parseInt(m[1], 10) : 9999; };
                        return n(a.descricao) - n(b.descricao);
                      }).map((t) => (
                      <TopicoCard
                        key={t.id}
                        topico={t}
                        liveStatuses={liveStatuses}
                        documents={topicoDocumentos.get(t.id) ?? []}
                        onDocumentsChange={handleDocumentsChange}
                        liveDocLogs={liveDocLogs}
                        liveMetaLogs={liveMetaLogs}
                        onAddMeta={(id) => {
                          setSelectedTopicoId(id);
                          setIsMetaDialogOpen(true);
                        }}
                        onTopicUpdated={fetchTemas}
                      />
                    ))}
                    {tema.topicos.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhuma meta cadastrado.</p>
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
