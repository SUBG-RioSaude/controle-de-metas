"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Users, ShieldCheck, Loader2, Search } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

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
      <div className="bg-white dark:bg-slate-900 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 divide-y divide-border/40">
          {/* Header */}
          <div className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] px-5 py-3 bg-slate-50 dark:bg-white/[0.02]">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10">Avatar</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pl-3">Nome / E-mail</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4">Role</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8" />
          </div>

          {filtered.length === 0 && (
            <div className="col-span-4 text-center py-8 text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
          )}

          {filtered.map((u) => (
            <motion.div
              key={u.id}
              layout
              className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] items-center px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border/50 shrink-0">
                {u.picture ? (
                  <img src={u.picture} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + email */}
              <div className="pl-3 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
              </div>

              {/* Role selector */}
              <div className="px-4">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                  disabled={!!updating}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none appearance-none ${ROLE_STYLE[u.role]}`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Loading indicator */}
              <div className="w-8 flex justify-center">
                {updating === u.id && <Loader2 size={14} className="animate-spin text-primary" />}
                {updating !== u.id && <ShieldCheck size={14} className="text-border" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
