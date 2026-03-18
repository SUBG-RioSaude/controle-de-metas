"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ShieldCheck, Loader2, Search, ChevronDown, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Role, ROLE_ENUM } from "@/lib/auth";

interface User {
  id:      string;
  name:    string;
  email:   string;
  picture: string;
  role:    Role;
}

const ROLES: Role[] = ["Visualizador", "Analista", "Aprovador", "Admin", "Pending"];

const ROLE_STYLE: Record<Role, string> = {
  Pending:      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20",
  Visualizador: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/20",
  Analista:     "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20",
  Aprovador:    "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20",
  Admin:        "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/20",
};

export function UsuariosView() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ success: boolean; data: User[] }>("/users")
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error("Erro ao carregar os usuários."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, newRole: Role) {
    setUpdating(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: ROLE_ENUM[newRole] });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Role atualizada com sucesso.");
    } catch {
      toast.error("Erro ao atualizar a role.");
    } finally {
      setUpdating(null);
    }
  }
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Usuários</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="pl-8 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 divide-y divide-border/40">
          {/* Header */}
          <div className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] px-5 py-3 bg-slate-50 dark:bg-white/[0.02]">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10">Avatar</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pl-3">Nome / E-mail</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4">Role / Permissão</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8" />
          </div>

          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-8 text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
          )}

          {filtered.map((u, idx) => (
            <UserRow 
              key={u.id} 
              user={u} 
              index={idx}
              isUpdating={updating === u.id} 
              onRoleChange={handleRoleChange} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── UserRow Component ──────────────────────────────────────────────────────────

interface UserRowProps {
  user: User;
  index: number;
  isUpdating: boolean;
  onRoleChange: (userId: string, newRole: Role) => void;
}

function UserRow({ user, index, isUpdating, onRoleChange }: UserRowProps) {
  const [open, setOpen] = useState(false);
  const isPending = user.role === "Pending";

  return (
    <motion.div
      layout
      className={`col-span-4 grid grid-cols-[auto_1fr_auto_auto] items-center px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-all relative ${
        isPending ? "bg-amber-500/[0.03]" : ""
      }`}
      style={{ zIndex: 50 - index }}
    >
      {isPending && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-border/50">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isPending && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </div>

      {/* Name + email */}
      <div className="pl-4 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          {isPending && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Ação Requerida
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
      </div>

      {/* Role selector dropdown */}
      <div className="px-4 relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${ROLE_STYLE[user.role]} ${
            open ? "ring-2 ring-primary/20" : ""
          }`}
        >
          {user.role}
          <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 border border-border/50 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden"
              >
                {ROLES.map((r) => {
                  const isSelected = user.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleChange(user.id, r);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${ROLE_STYLE[r].split(" ")[0]}`} />
                        {r}
                      </div>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Loading indicator */}
      <div className="w-8 flex justify-center">
        {isUpdating ? (
          <Loader2 size={14} className="animate-spin text-primary" />
        ) : isPending ? (
          <AlertCircle size={14} className="text-amber-500" />
        ) : (
          <ShieldCheck size={14} className="text-emerald-500/50" />
        )}
      </div>
    </motion.div>
  );
}
