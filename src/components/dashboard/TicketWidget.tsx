"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Plus,
  ChevronLeft,
  Loader2,
  Clock,
  CheckCircle2,
  Ban,
  Activity,
  Send,
  AlertCircle,
  Headset
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────

interface TicketLog {
  id: string;
  message: string;
  createdAt: string;
  authorName: string;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  systemId: string;
  systemName: string;
  categoryDiscordId: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  resolutionMessage?: string;
  discordChannelId?: string;
  assignedDiscordUserId?: string;
  status: string; // "Pendente", "Em Andamento", "Resolvido", "Cancelado"
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  ticketLogs: TicketLog[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pendente: {
    label: "Pendente",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    icon: <Clock size={12} />,
  },
  EmAndamento: {
    label: "Em Andamento",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    icon: <Activity size={12} />,
  },
  "Em Andamento": {
    label: "Em Andamento",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    icon: <Activity size={12} />,
  },
  Resolvido: {
    label: "Resolvido",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    icon: <CheckCircle2 size={12} />,
  },
  Cancelado: {
    label: "Cancelado",
    color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    icon: <Ban size={12} />,
  },
};

const DEFAULT_STATUS = {
  label: "Desconhecido",
  color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  icon: <AlertCircle size={12} />,
};

// ── Component ─────────────────────────────────────────────────────────────

export function TicketWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Formulário de criação
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Fetch Tickets
  const fetchTickets = async () => {
    if (!user?.token) return;
    setLoading(true);

    const systemId = process.env.NEXT_PUBLIC_SYSTEM_ID;
    const supportApi = process.env.NEXT_PUBLIC_SUPPORT_API;
    
    try {
      const url = `${supportApi}/Ticket?Page=1&PageSize=50&UserId=${user.userId}&SystemId=${systemId}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Falha ao buscar tickets");
      const data = await res.json();
      setTickets(data?.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && view === "list") {
      fetchTickets();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view]);

  // ── Create Ticket
  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    
    setCreating(true);
    try {
      const supportApi = process.env.NEXT_PUBLIC_SUPPORT_API;
      const res = await fetch(`${supportApi}/Ticket`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user?.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemId: process.env.NEXT_PUBLIC_SYSTEM_ID,
          systemName: "Controle de Metas",
          categoryDiscordId: process.env.NEXT_PUBLIC_DISCORD_CATEGORY_ID,
          userId: user?.userId,
          username: user?.name,
          title,
          description
        })
      });

      if (!res.ok) throw new Error("Falha ao criar ticket");
      
      toast.success("Chamado aberto com sucesso!");
      setTitle("");
      setDescription("");
      setView("list");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar chamado.");
    } finally {
      setCreating(false);
    }
  };

  // ── Helpers
  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("pt-BR", { 
        day: "2-digit", month: "long", year: "numeric", 
        hour: "2-digit", minute: "2-digit" 
      }).format(new Date(iso)).replace(" de ", " ");
    } catch {
      return iso;
    }
  };

  const currentTickets = tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mb-5 w-[380px] max-w-[calc(100vw-32px)] bg-slate-50 dark:bg-slate-950 border border-border/60 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[600px] max-h-[75vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 pb-6 flex flex-col relative shrink-0">
              {/* Patterns abstract background */}
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {view !== "list" && (
                    <button 
                      onClick={() => setView("list")}
                      className="text-white/80 hover:text-white transition-colors p-1 -ml-2 rounded-full hover:bg-white/10"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                      <Headset size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-[15px] drop-shadow-sm">
                        Central de Ajuda
                      </h3>
                      <p className="text-white/80 text-xs mt-0.5 font-medium">
                        {view === "list" ? "Meus chamados" : view === "create" ? "Novo Chamado" : "Detalhes da Solicitação"}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-white hover:bg-black/20 transition-all backdrop-blur-sm"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto relative flex flex-col -mt-4 bg-slate-50 dark:bg-slate-950 rounded-t-3xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pt-6 px-4 pb-4">
              
              {/* ── View: LIST ── */}
              {view === "list" && (
                <div className="flex flex-col gap-3 flex-1">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 h-full">
                      <Loader2 size={26} className="animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground font-semibold">Buscando chamados...</span>
                    </div>
                  ) : currentTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-full pb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-5 border border-primary/10 shadow-sm">
                        <MessageSquare size={28} className="text-primary/70" />
                      </div>
                      <h4 className="text-[15px] font-bold text-foreground">Como podemos ajudar?</h4>
                      <p className="text-sm text-muted-foreground mt-2 px-6 leading-relaxed">Não hesite em abrir um chamado caso tenha dúvidas, problemas ou precise de alguma configuração visual.</p>
                      <button 
                        onClick={() => setView("create")}
                        className="mt-6 font-bold text-sm bg-primary text-primary-foreground px-6 py-2.5 rounded-full shadow-md hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                       <Plus size={16}/> Abrir um Chamado
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-2">
                      {currentTickets.map(t => {
                        const cfg = STATUS_CONFIG[t.status] || DEFAULT_STATUS;
                        return (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={t.id}
                            onClick={() => { setSelectedTicket(t); setView("detail"); }}
                            className="w-full text-left bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5 hover:border-primary/40 dark:hover:border-primary/40 shadow-sm hover:shadow transition-all group"
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <span className="text-[13px] font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug pr-2">
                                {t.title}
                              </span>
                              <span className="text-[11px] font-black text-muted-foreground bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                                #{t.ticketNumber}
                              </span>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">
                              {t.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                              
                              {t.updatedBy && t.updatedBy !== user?.userId && t.updatedBy !== user?.name && (
                                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                                  <span>Respondido por</span>
                                  <span className="font-bold text-foreground">{t.updatedBy.split('.')[0]}</span>
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── View: CREATE ── */}
              {view === "create" && (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col gap-5 flex-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest pl-1">Resumo do Problema</label>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: Erro ao cadastrar meta no setor RH"
                        className="w-full text-sm font-medium px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-slate-900 text-foreground transition-all shadow-sm"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[11px] font-bold text-foreground/80 uppercase tracking-widest pl-1">Descrição Detalhada</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detalhe o máximo possível o que está acontecendo. Fique à vontade para copiar as mensagens do sistema..."
                        className="w-full text-sm leading-relaxed px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-slate-900 text-foreground transition-all resize-none flex-1 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button 
                      onClick={handleCreate} 
                      disabled={creating || !title.trim() || !description.trim()}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all mt-auto py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 text-[14px]"
                    >
                      {creating ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Enviar Solicitação</>}
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground mt-3 px-4 font-medium leading-relaxed">
                      Nossa equipe avaliará o seu chamado e responderá através da plataforma o mais rápido possível.
                    </p>
                  </div>
                </div>
              )}

              {/* ── View: DETAIL ── */}
              {view === "detail" && selectedTicket && (
                <div className="flex flex-col gap-5 pb-2">
                  <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm relative">
                    <div className="mb-4 flex gap-3 justify-between items-start">
                      <h4 className="text-[15px] font-bold text-foreground leading-snug">{selectedTicket.title}</h4>
                      <span className="text-[10px] h-fit bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md font-black text-muted-foreground shrink-0">#{selectedTicket.ticketNumber}</span>
                    </div>
                    
                    <p className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                    
                    <div className="mt-5 pt-5 border-t border-dashed border-border/60 grid grid-cols-2 gap-y-4 gap-x-3">
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Status Atual</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${STATUS_CONFIG[selectedTicket.status]?.color || DEFAULT_STATUS.color}`}>
                          {STATUS_CONFIG[selectedTicket.status]?.icon || DEFAULT_STATUS.icon}
                          {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Última Modificação</span>
                        <span className="text-[11px] font-semibold text-foreground/90">{formatDate(selectedTicket.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTicket.resolutionMessage && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <CheckCircle2 size={64} />
                      </div>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                        <CheckCircle2 size={16} /> Resolução
                      </span>
                      <p className="text-[13px] text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium relative z-10">{selectedTicket.resolutionMessage}</p>
                    </div>
                  )}

                  {selectedTicket.ticketLogs?.length > 0 && (
                    <div className="mt-2 pl-2 pr-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-4 flex items-center gap-2">
                         Histórico de Ações
                      </span>
                      <div className="flex flex-col gap-5 border-l-2 border-slate-200 dark:border-slate-800 ml-2 pl-5 py-1">
                        {selectedTicket.ticketLogs.map((log, idx) => (
                          <div key={log.id} className="relative">
                            <div className={`absolute -left-[27px] top-[7px] w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 dark:ring-slate-950 ${idx === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <div className="bg-white/50 dark:bg-white/[0.02] border border-border/40 rounded-xl p-3 shadow-sm">
                              <p className="text-xs text-foreground/90 leading-relaxed font-medium">{log.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-bold tracking-wide">
                                <span className="text-primary/80">{log.authorName}</span>
                                <span className="opacity-40">•</span>
                                <span className="font-medium text-[9px] uppercase tracking-widest">{formatDate(log.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer sticky area for LIST */}
            {view === "list" && currentTickets.length > 0 && (
              <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-border/40 p-3 shrink-0">
                <button 
                  onClick={() => setView("create")} 
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-transparent hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow shadow-slate-900/10 font-bold text-sm py-3.5 rounded-2xl"
                >
                  <Plus size={16} />
                  Abrir Novo Chamado
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        animate={!open ? { y: [0, -4, 0] } : { y: 0 }}
        transition={{ repeat: !open ? Infinity : 0, duration: 2.5, ease: "easeInOut" }}
        className={`w-[60px] h-[60px] rounded-[24px] flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] transition-all relative
          ${open 
            ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-full" 
            : "bg-gradient-to-br from-primary to-blue-600 text-white"
          }
        `}
      >
        {open ? <X size={26} strokeWidth={2.5} /> : <MessageSquare size={26} strokeWidth={2} />}
      </motion.button>
    </div>
  );
}
