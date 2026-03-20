"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TemasView } from "./TemasView";
import { UsuariosView } from "./UsuariosView";
import { MarcosView } from "./MarcosView";
import { SetoresView } from "./SetoresView";
import { TicketWidget } from "./TicketWidget";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Home, LogOut, ChevronRight,
  BarChart3, Target, Flag, Building2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Role } from "@/lib/auth";

type View = "temas" | "usuarios" | "marcos" | "setores";

const ROLE_BADGE: Record<Role, { label: string; color: string }> = {
  Pending:      { label: "Pendente",     color: "bg-amber-400/15 text-amber-400 border-amber-400/20" },
  Visualizador: { label: "Visualizador", color: "bg-sky-400/15 text-sky-400 border-sky-400/20" },
  Analista:     { label: "Analista",     color: "bg-violet-400/15 text-violet-400 border-violet-400/20" },
  Aprovador:    { label: "Aprovador",    color: "bg-emerald-400/15 text-emerald-400 border-emerald-400/20" },
  Admin:        { label: "Admin",        color: "bg-rose-400/15 text-rose-400 border-rose-400/20" },
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [view, setView]  = useState<View>("temas");

  if (!user) return null;

  const badge      = ROLE_BADGE[user.role];
  const canSeeData = user.role !== "Pending";
  const isAdmin    = user.role === "Admin";

  const navLinks: { id: View; label: string; icon: React.ReactNode; visible: boolean }[] = [
    { id: "temas",    label: "Metas & Tópicos", icon: <Target size={16} />,   visible: canSeeData },
    { id: "setores",  label: "Setores",         icon: <Building2 size={16} />, visible: isAdmin },
    { id: "marcos",   label: "Marcos",          icon: <Flag size={16} />,     visible: isAdmin },
    { id: "usuarios", label: "Usuários",        icon: <Users size={16} />,    visible: isAdmin },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-border/50 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Controle de Metas</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">SMS Rio · TCMRio</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name.split(" ")[0]}</p>
              <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navLinks.filter((l) => l.visible).map((link) => (
            <button
              key={link.id}
              onClick={() => setView(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                view === link.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {link.icon}
              {link.label}
              {view === link.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border/50 flex flex-col gap-1">
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <Home size={16} />
            Página Inicial
          </Link>
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Logos */}
        <div className="px-4 pb-4 flex items-center gap-2 opacity-40">
          <Image src="/brand/logoazul.png" alt="SMS" width={60} height={18} className="block dark:hidden object-contain" />
          <Image src="/brand/logobranca.png" alt="SMS" width={60} height={18} className="hidden dark:block object-contain" />
          <div className="w-px h-4 bg-border/50" />
          <Image src="/brand/tcmrio-logo.png" alt="TCMRio" width={48} height={14} className="object-contain" />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-border/50 px-8 py-4 flex items-center gap-3">
          <LayoutDashboard size={18} className="text-primary" />
          <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
          <div className="ml-auto text-xs text-muted-foreground">Plano de Ação 2025</div>
        </div>

        {/* View */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-8"
        >
          {view === "temas"    && <TemasView />}
          {view === "setores"  && isAdmin && <SetoresView />}
          {view === "marcos"   && isAdmin && <MarcosView />}
          {view === "usuarios" && isAdmin && <UsuariosView />}
        </motion.div>
      </main>
      
      {/* ── Support Widget ────────────────────────────────────────────────── */}
      <TicketWidget />
    </div>
  );
}
