"use client";

import { motion } from "framer-motion";
import { LogOut, Clock } from "lucide-react";
import Image from "next/image";
import { AuthUser, clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Props {
  user: AuthUser;
}

export function PendingApprovalScreen({ user }: Props) {
  const router = useRouter();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#13335a" }}
    >
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full opacity-[0.18]"
          style={{
            background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[50%] h-[50%] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #1a4a7a 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#42b9eb]/30 ring-offset-2 ring-offset-transparent">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#42b9eb]/20 flex items-center justify-center text-2xl font-bold text-[#42b9eb]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#13335a] flex items-center justify-center">
            <Clock size={12} className="text-[#13335a]" />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h2 className="text-white font-bold text-xl leading-tight">
            Olá, {user.name.split(" ")[0]}!
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Seu acesso está <span className="text-amber-400 font-semibold">pendente de aprovação</span>.
            <br />
            Um administrador precisa liberar seu perfil antes que você possa acessar a plataforma.
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 text-xs font-semibold tracking-wide">
            Aguardando aprovação do administrador
          </span>
        </div>

        {/* Logos */}
        <div className="flex items-center gap-4 pt-2">
          <Image src="/brand/logobranca.png" alt="SMS Rio" width={100} height={28} className="object-contain opacity-60" />
          <div className="w-px h-6 bg-white/15" />
          <Image src="/brand/tcmrio-logo.png" alt="TCMRio" width={72} height={20} className="object-contain opacity-60" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </motion.div>
    </div>
  );
}
