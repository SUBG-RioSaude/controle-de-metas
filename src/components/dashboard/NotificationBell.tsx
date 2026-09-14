"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X, Loader2, FileText, Users, RefreshCw, Target, Upload } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { type ApiNotificacao } from "@/lib/types";
import { type NotificacaoPayload } from "@/hooks/useMetaHub";

// ── Ícone por tipo ────────────────────────────────────────────────────────────

function TipoIcon({ tipo }: { tipo: string }) {
  const cls = "w-4 h-4 shrink-0";
  switch (tipo) {
    case "meta_pendente":    return <Target    className={`${cls} text-amber-400`} />;
    case "doc_novo":         return <Upload    className={`${cls} text-sky-400`} />;
    case "devolucao":        return <RefreshCw className={`${cls} text-rose-400`} />;
    case "doc_reenviado":    return <FileText  className={`${cls} text-amber-400`} />;
    case "doc_confirmacao":  return <CheckCheck className={`${cls} text-violet-400`} />;
    case "doc_aprovado":     return <Check     className={`${cls} text-emerald-400`} />;
    case "novo_usuario":     return <Users     className={`${cls} text-sky-400`} />;
    default:                 return <Bell      className={`${cls} text-muted-foreground`} />;
  }
}

function tempo(criadoEm: string) {
  const diff = Date.now() - new Date(criadoEm).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  onNavigate: (view: string, topicoId?: string) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [open, setOpen]                   = useState(false);
  const [items, setItems]                 = useState<ApiNotificacao[]>([]);
  const [loading, setLoading]             = useState(false);
  const [fetched, setFetched]             = useState(false);
  const [unread, setUnread]               = useState(0);
  const containerRef                      = useRef<HTMLDivElement>(null);

  // ── Fechar ao clicar fora ─────────────────────────────────────────────────
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // ── Buscar contagem inicial ───────────────────────────────────────────────
  useEffect(() => {
    api.get<{ data: number }>("/notificacoes/unread-count")
      .then(r => setUnread(r.data.data))
      .catch(() => {});
  }, []);

  // ── Buscar notificações ao abrir ─────────────────────────────────────────
  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    api.get<{ data: ApiNotificacao[] }>("/notificacoes")
      .then(r => { setItems(r.data.data); setFetched(true); })
      .catch(() => toast.error("Erro ao carregar notificações."))
      .finally(() => setLoading(false));
  }, [open, fetched]);

  // ── Receber nova notificação via SignalR ──────────────────────────────────
  const addNotificacao = useCallback((p: NotificacaoPayload) => {
    setUnread(prev => prev + 1);
    setItems(prev => [p as ApiNotificacao, ...prev]);
    toast.info(p.titulo, { description: p.mensagem, duration: 5000 });
  }, []);

  // Expor o handler para o DashboardPage conectar ao SignalR
  (NotificationBell as { _handler?: typeof addNotificacao })._handler = addNotificacao;

  // ── Ações ─────────────────────────────────────────────────────────────────
  async function marcarLida(id: string) {
    await api.patch(`/notificacoes/${id}/read`).catch(() => {});
    setItems(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  async function marcarTodasLidas() {
    await api.patch("/notificacoes/read-all").catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, lida: true })));
    setUnread(0);
  }

  async function excluir(id: string, lida: boolean) {
    await api.delete(`/notificacoes/${id}`).catch(() => {});
    setItems(prev => prev.filter(n => n.id !== id));
    if (!lida) setUnread(prev => Math.max(0, prev - 1));
  }

  function handleClick(n: ApiNotificacao) {
    if (!n.lida) marcarLida(n.id);
    if (n.link) {
      const [view, qs] = n.link.split("?");
      const params = new URLSearchParams(qs ?? "");
      onNavigate(view, params.get("topicoId") ?? undefined);
      setOpen(false);
    }
  }

  const naoLidas = items.filter(n => !n.lida).length;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Sino ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
        aria-label="Notificações"
      >
        <motion.div animate={unread > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </motion.div>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Modal ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[520px] flex flex-col bg-slate-900 border border-border/50 rounded-2xl shadow-2xl z-[200] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Notificações</span>
                {naoLidas > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {naoLidas} nova{naoLidas !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Carregando...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Bell className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => (
                    <li
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-border/30 last:border-0 group transition-colors ${
                        !n.lida ? "bg-primary/[0.03]" : ""
                      } hover:bg-white/[0.03]`}
                    >
                      {/* Ícone */}
                      <div className="mt-0.5 shrink-0">
                        <TipoIcon tipo={n.tipo} />
                      </div>

                      {/* Conteúdo */}
                      <button
                        className="flex-1 text-left min-w-0"
                        onClick={() => handleClick(n)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] font-semibold leading-snug ${!n.lida ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.titulo}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{tempo(n.criadoEm)}</span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {n.mensagem}
                        </p>
                      </button>

                      {/* Ações */}
                      <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.lida && (
                          <button
                            onClick={() => marcarLida(n.id)}
                            className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => excluir(n.id, n.lida)}
                          className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Dot não lida */}
                      {!n.lida && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
