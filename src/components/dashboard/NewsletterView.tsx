"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, Search, Send, Users } from "lucide-react";
import { toast } from "sonner";
import type { NewsletterSubscriber } from "@/lib/types";

export function NewsletterView() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [days, setDays] = useState("1");
  const [sending, setSending] = useState(false);

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchSubscribers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchSubscribers() {
    api
      .get<{ success: boolean; data: NewsletterSubscriber[] }>("/newsletter/subscribers")
      .then((r) => setSubscribers(r.data.data))
      .catch(() => toast.error("Erro ao carregar subscribers."))
      .finally(() => setLoading(false));
  }

  async function handleSendDigest() {
    const d = parseInt(days, 10);
    if (isNaN(d) || d < 1) {
      toast.error("Informe um número de dias válido.");
      return;
    }
    setSending(true);
    try {
      const r = await api.post<{ success: boolean; data: { documentosEnviados: number } }>(
        `/newsletter/send-digest?days=${d}`
      );
      const count = r.data.data.documentosEnviados;
      if (count > 0) {
        toast.success(`Resumo enviado com ${count} documento${count !== 1 ? "s" : ""}.`);
      } else {
        toast.info("Nenhum documento aprovado no período. Nenhum e-mail enviado.");
      }
    } catch {
      toast.error("Erro ao enviar o resumo.");
    } finally {
      setSending(false);
    }
  }

  const filtered = subscribers.filter(
    (s) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Newsletter</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subscribers.length} inscrito{subscribers.length !== 1 ? "s" : ""} ativo{subscribers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar inscrito..."
            className="pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-56"
          />
        </div>
      </div>

      {/* Send digest card */}
      <div className="bg-slate-900 border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Send size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Enviar Resumo Manual</p>
            <p className="text-[11px] text-muted-foreground">
              Dispara o envio do digest com os documentos aprovados nos últimos N dias.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Dias
            </label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full sm:w-24 px-3 py-2.5 text-sm rounded-xl bg-slate-800 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleSendDigest}
            disabled={sending}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Enviar Resumo
          </button>
        </div>
      </div>

      {/* Subscribers list */}
      {subscribers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum inscrito na newsletter.</p>
          <p className="text-xs text-muted-foreground">
            Quando alguém se inscrever na página inicial, aparecerá aqui.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-sm text-muted-foreground">
            Nenhum inscrito encontrado para &quot;{search}&quot;.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] px-5 py-3 bg-white/[0.02] border-b border-border/40">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Nome
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              E-mail
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Inscrito em
            </span>
          </div>

          <div className="divide-y divide-border/40">
            <AnimatePresence initial={false}>
              {filtered.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.02 }}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-1 sm:gap-0 px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {sub.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {sub.nome}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate pl-11 sm:pl-0">
                    {sub.email}
                  </span>
                  <span className="text-[11px] text-muted-foreground pl-11 sm:pl-0 sm:text-right whitespace-nowrap">
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(sub.criadoEm))}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
