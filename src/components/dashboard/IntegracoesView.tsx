"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import {
  Plug, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface DriveStatus {
  configured:      boolean;
  issuedAt?:       string;
  expiresAt?:      string;
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
  isExpired?:      boolean;
  rotatedByUserId?: string | null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function IntegracoesView() {
  const [status, setStatus]         = useState<DriveStatus | null>(null);
  const [loading, setLoading]       = useState(true);
  const [authorizing, setAuthorizing] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const r = await api.get<DriveStatus>("/admin/integrations/google-drive/status");
      setStatus(r.data);
    } catch {
      toast.error("Erro ao carregar status da integração.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Callback do OAuth volta com ?google_drive=ok — mostra toast e limpa query
    const qs = new URLSearchParams(window.location.search);
    if (qs.get("google_drive") === "ok") {
      toast.success("Google Drive reautorizado com sucesso.");
      qs.delete("google_drive");
      const url = new URL(window.location.href);
      url.search = qs.toString();
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleAuthorize() {
    setAuthorizing(true);
    try {
      const r = await api.get<{ authorizationUrl: string }>(
        "/admin/integrations/google-drive/authorize"
      );
      // Redireciona a janela atual para o Google — admin volta via /callback
      window.location.href = r.data.authorizationUrl;
    } catch {
      toast.error("Erro ao iniciar autorização.");
      setAuthorizing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const s = status;
  const state: "ok" | "warn" | "error" | "missing" =
    !s?.configured ? "missing"
    : s.isExpired ? "error"
    : s.isExpiringSoon ? "warn"
    : "ok";

  const badge = {
    ok:      { color: "bg-emerald-400/10 text-emerald-500 border-emerald-400/20", icon: <CheckCircle2 size={14} />, label: "Conectado" },
    warn:    { color: "bg-amber-400/10 text-amber-500 border-amber-400/20",       icon: <AlertTriangle size={14} />, label: "Expira em breve" },
    error:   { color: "bg-rose-400/10 text-rose-500 border-rose-400/20",          icon: <XCircle size={14} />,       label: "Expirado" },
    missing: { color: "bg-slate-400/10 text-slate-500 border-slate-400/20",       icon: <XCircle size={14} />,       label: "Não configurado" },
  }[state];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Integrações</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerenciar conexões com serviços externos usados pelo Controle de Metas.
        </p>
      </div>

      {/* Google Drive card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col gap-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Plug size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">Google Drive</h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.icon}
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usado para armazenar os documentos anexados a tópicos e metas.
              O token de atualização precisa ser renovado periodicamente.
            </p>
          </div>
        </div>

        {/* Status grid */}
        {s?.configured && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoRow label="Emitido em"   value={formatDate(s.issuedAt)} />
            <InfoRow label="Expira em"    value={formatDate(s.expiresAt)} />
            <InfoRow
              label="Tempo restante"
              value={
                s.isExpired
                  ? "Expirado"
                  : `${s.daysUntilExpiry ?? 0} dia(s)`
              }
              tone={state === "error" ? "error" : state === "warn" ? "warn" : "ok"}
            />
          </div>
        )}

        {!s?.configured && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
            Nenhum refresh token registrado. Clique em <b>Reautorizar Google Drive</b> para conceder acesso.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1">
          <button
            onClick={handleAuthorize}
            disabled={authorizing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {authorizing ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
            Reautorizar Google Drive
          </button>
          <button
            onClick={fetchStatus}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border/50 text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
            Atualizar status
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Ao clicar em reautorizar você será redirecionado para o Google.
          Após autorizar, o novo token é persistido automaticamente e todos os uploads voltam a funcionar sem redeploy.
          Alertas de expiração são enviados para o e-mail de operação (<code>devsubg.smsrio@gmail.com</code>).
        </p>
      </motion.div>
    </div>
  );
}

function InfoRow({
  label, value, tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn" | "error";
}) {
  const toneColor = {
    neutral: "text-foreground",
    ok:      "text-emerald-500",
    warn:    "text-amber-500",
    error:   "text-rose-500",
  }[tone];

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/40 p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${toneColor}`}>{value}</p>
    </div>
  );
}
