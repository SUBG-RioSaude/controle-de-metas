"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  LayoutList, CheckCircle2, Clock3, FileCheck2,
  BarChart3, Calendar, LayoutDashboard, Home, LogOut, ChevronDown,
  Menu, X, Flag, Milestone, BarChart2, CalendarDays, Target,
} from "lucide-react";
import { planos, etapas, marcos } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { NavLink } from "./NavLink";



const navItems = [
  { id: "hero",       label: "Início",     icon: Home },
  { id: "panorama",   label: "Panorama",   icon: LayoutList },
  { id: "marcos",     label: "Marcos",     icon: Milestone },
  { id: "temas",      label: "Temas",      icon: Target },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  Pending:      { label: "Pendente",     color: "bg-amber-400/20 text-amber-400" },
  Visualizador: { label: "Visualizador", color: "bg-sky-400/20 text-sky-400" },
  Analista:     { label: "Analista",     color: "bg-violet-400/20 text-violet-400" },
  Aprovador:    { label: "Aprovador",    color: "bg-emerald-400/20 text-emerald-400" },
  Admin:        { label: "Admin",        color: "bg-rose-400/20 text-rose-400" },
};

function firstAndLast(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function DropdownPanorama() {
  const total      = etapas.length;
  const concluidas = etapas.filter((e) => e.status === "Concluída").length;
  const emAndamento = etapas.filter((e) => e.status === "Em Andamento").length;
  const docsGerados = etapas.filter((e) => e.documento_comprobatorio === "Documento Gerado").length;
  const stats = [
    { icon: LayoutList,   label: "Total etapas", value: total },
    { icon: CheckCircle2, label: "Concluídas",   value: concluidas },
    { icon: Clock3,       label: "Em Andamento", value: emAndamento },
    { icon: FileCheck2,   label: "Docs Gerados", value: docsGerados },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col items-start gap-1 p-2 rounded-xl bg-slate-50 dark:bg-white/5">
          <Icon size={14} className="text-primary" />
          <span className="text-base font-bold text-foreground leading-none">{value}</span>
          <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}

function DropdownPlanos() {
  return (
    <div className="flex flex-col gap-1">
      {planos.slice(0, 5).map((plano) => (
        <a key={plano.id} href="#planos"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono shrink-0">
            {plano.code}
          </span>
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[150px]">
            {plano.title}
          </span>
        </a>
      ))}
      <div className="mt-1 pt-2 border-t border-slate-200/80 dark:border-white/10">
        <a href="#planos" className="text-[11px] text-primary font-medium hover:underline">Ver todos os planos →</a>
      </div>
    </div>
  );
}

function DropdownMarcos() {
  const proximos = marcos.filter((m) => {
    const diff = new Date(m.date).getTime() - new Date("2026-03-16").getTime();
    return diff / 86400000 > 1;
  }).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 shrink-0">
          <Flag size={16} className="text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">
            Marcos do Processo
          </span>
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            {proximos} marcos próximos no ciclo de monitoramento.
          </span>
        </div>
      </div>
      <a
        href="#marcos"
        className="text-[11px] text-primary font-medium hover:underline"
      >
        Ver linha do tempo →
      </a>
    </div>
  );
}

function DropdownAnalise() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 shrink-0">
          <BarChart3 size={16} className="text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">Evolução Mensal</span>
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            Distribuição de etapas por mês e status ao longo de 2025.
          </span>
        </div>
      </div>
      <a href="#analise" className="text-[11px] text-primary font-medium hover:underline">Ver análise →</a>
    </div>
  );
}

function DropdownCalendario() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 shrink-0">
          <Calendar size={16} className="text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground">Calendário de Prazos</span>
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            Visualize prazos e etapas por data de vencimento.
          </span>
        </div>
      </div>
      <a href="#calendario" className="text-[11px] text-primary font-medium hover:underline">Ver calendário →</a>
    </div>
  );
}

const dropdownContent: Record<string, React.ComponentType> = {
  panorama: DropdownPanorama,
  marcos: DropdownMarcos,
};

// ── User Card Dropdown ────────────────────────────────────────────────────────

function UserCard() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!user) return null;

  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.Pending;
  const displayName = firstAndLast(user.name);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-1.5 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-primary/30 shrink-0">
          {user.picture ? (
            <Image src={user.picture} alt={user.name} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden lg:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""} hidden sm:block`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute top-full right-0 mt-3 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl p-2 z-50"
          >
            {/* User info header */}
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
                {user.picture ? (
                  <Image src={user.picture} alt={user.name} width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
                <span className={`self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            <div className="h-px bg-border/50 my-1" />

            {/* Menu items */}
            <Link href="#hero" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm text-foreground">
              <Home size={14} className="text-muted-foreground shrink-0" />
              Página Inicial
            </Link>

            <Link href={user.role === "Pending" ? "/login" : "/dashboard"} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-sm text-foreground">
              <LayoutDashboard size={14} className="text-muted-foreground shrink-0" />
              Dashboard
            </Link>

            <div className="h-px bg-border/50 my-1" />

            <button onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-sm text-rose-500">
              <LogOut size={14} className="shrink-0" />
              Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

export function Navbar() {
  const [active, setActive]           = useState("hero");
  const [scrolled, setScrolled]       = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted]         = useState(false);
  const { user, logout }              = useAuth();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      for (const item of [...navItems].reverse()) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(item.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize if screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`flex items-center justify-between md:justify-center gap-4 md:gap-6 px-4 md:px-6 py-2 rounded-2xl bg-white/[0.88] dark:bg-slate-900/[0.82] backdrop-blur-xl transition-all duration-300 w-full md:w-fit md:mx-auto ${
          scrolled
            ? "shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,180,180,0.07)] dark:shadow-[0_0_0_1px_rgba(0,180,180,0.12),0_4px_16px_rgba(0,0,0,0.5),0_20px_60px_rgba(0,180,180,0.10)]"
            : "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,180,180,0.05)] dark:shadow-[0_0_0_1px_rgba(0,180,180,0.08),0_2px_8px_rgba(0,0,0,0.35),0_12px_36px_rgba(0,180,180,0.08)]"
        }`}
      >
        {/* Logos & Hamburger */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-border/50 bg-background/50 text-muted-foreground hover:text-foreground transition-all"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="relative flex items-center">
            <Image src="/brand/logoazul.png"    alt="Prefeitura Rio Saúde" width={90} height={28} className="block dark:hidden object-contain md:w-[100px] md:h-[32px]" priority />
            <Image src="/brand/logobranca.png"  alt="Prefeitura Rio Saúde" width={90} height={28} className="hidden dark:block object-contain md:w-[100px] md:h-[32px]" priority />
          </div>
          
          <div className="w-px h-6 bg-border/40 hidden xs:block" />
          
          <Image src="/brand/tcmrio-logo.png" alt="TCMRio" width={64} height={24} className="object-contain hidden xs:block md:w-[72px] md:h-[28px]" priority />
        </div>

        <div className="w-px h-4 bg-border/40 mx-0.5 md:mx-1 hidden md:block" />

        {/* Desktop Nav items */}
        <div className="hidden md:flex items-center">
          {navItems.map((item, index) => {
            const isActive     = active === item.id;
            const hasDropdown  = item.id !== "hero";
            const isLast       = index === navItems.length - 1;

            return (
              <div key={item.id} className="flex items-center">
                <div className="relative"
                  onMouseEnter={() => hasDropdown && setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <a
                    href={`#${item.id}`}
                    className={`relative flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.span layoutId="pill"
                        className="absolute inset-0 rounded-full bg-primary/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative">{item.label}</span>
                  </a>

                  <AnimatePresence>
                    {hasDropdown && openDropdown === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xl p-4 min-w-[220px]"
                      >
                        {(() => {
                          const Content = dropdownContent[item.id];
                          return Content ? <Content /> : null;
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!isLast && <div className="w-px h-3.5 bg-border/30 mx-0.5 shrink-0" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* User card OR login button */}
          {mounted && user ? (
            <UserCard />
          ) : mounted && !user ? (
            <Link href="/login"
              className="flex text-white items-center text-xs md:text-sm font-medium px-3 md:px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all">
              Login
            </Link>
          ) : null}
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-0 left-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[-1] md:hidden"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-3 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl z-50 md:hidden flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = active === item.id;
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-base">{item.label}</span>
                      {isActive && <motion.div layoutId="mobile-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </a>
                  );
                })}
              </div>

              {user && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <Link
                      href={user.role === "Pending" ? "/login" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                      <LayoutDashboard size={18} />
                      <span className="text-base font-medium">Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-left"
                    >
                      <LogOut size={18} />
                      <span className="text-base font-medium">Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
