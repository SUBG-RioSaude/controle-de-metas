"use client";

import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { loginWithGoogle, AuthUser } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

// ── Animation Variants ────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

export function LoginPage() {
  const router = useRouter();
  const { setUser, user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  // ── Handlers & Effects ──────────────────────────────────────────────────────

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      toast.error("Não foi possível obter credenciais do Google.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      setUser(user);

      if (user.role === "Pending") {
        setPendingUser(user);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authUser && authUser.role !== "Pending" && pendingUser) {
      setPendingUser(null);
      window.location.href = "/dashboard";
      return;
    }

    if (authUser?.role === "Pending") {
      setPendingUser(authUser);
    }
  }, [authUser, pendingUser, router]);

  if (pendingUser) {
    return <PendingApprovalScreen user={pendingUser} />;
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans"
      style={{ backgroundColor: "#0b1626" }} // Fundo mais profundo para dar contraste às auroras
    >
      {/* ── Fundo Animado (Aurora) ───────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle, #2a688f 0%, transparent 60%)" }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] right-[0%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle, #42b9eb 0%, transparent 60%)" }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, 50, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle, #13335a 0%, transparent 70%)" }}
        />
        
        {/* Padrão pontilhado sutil */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.1]" />
      </div>

      <AnimatePresence>
        {!pendingUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-[420px] mx-4"
          >
            {/* ── Card Principal (Glassmorphism Premium) ────────────────────── */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.08] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] rounded-[32px] p-10 flex flex-col items-center relative overflow-hidden"
            >
              {/* Highlight superior */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Voltar ao início */}
              <motion.button 
                variants={itemVariants}
                onClick={() => router.push("/")}
                className="absolute top-5 left-5 flex items-center gap-1.5 text-white/30 hover:text-white/80 transition-all duration-300 text-[9px] font-bold uppercase tracking-widest pl-2 pr-3 py-1.5 rounded-full hover:bg-white/5"
              >
                <ArrowLeft size={12} />
                Início
              </motion.button>

              {/* Logos */}
              <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 mt-6 mb-8 w-full">
                <div className="flex items-center gap-5">
                  <Image 
                    src="/brand/logobranca.png" 
                    alt="SMS Rio" 
                    width={130} 
                    height={38} 
                    className="object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]" 
                    priority 
                  />
                  <div className="w-[1px] h-9 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
                  <Image 
                    src="/brand/tcmrio-logo.png" 
                    alt="TCMRio" 
                    width={90} 
                    height={26} 
                    className="object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]" 
                  />
                </div>
              </motion.div>

              {/* Títulos */}
              <motion.div variants={itemVariants} className="text-center w-full mb-8">
                <div className="inline-flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full mb-5 shadow-inner">
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-200">Acesso Restrito</span>
                </div>
                <h1 className="text-white font-extrabold text-[28px] tracking-tight leading-tight mb-2">
                  Controle de Metas
                </h1>
                <p className="text-white/50 text-[13px] leading-relaxed max-w-[280px] mx-auto font-medium">
                  Identifique-se utilizando sua conta Google
                </p>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

              {/* Botão Google / Loading */}
              <motion.div variants={itemVariants} className="w-full flex justify-center relative group">
                {/* Glow interativo atrás do botão */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-full" />
                
                <div className={`relative z-10 w-full flex justify-center transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      toast.error("Login cancelado ou falhou.");
                      setLoading(false);
                    }}
                    useOneTap={false}
                    text="signin_with"
                    shape="pill"      // Visual mais moderno (cápsula)
                    theme="outline"   // Combina melhor com fundos escuros e glassmorphism
                    size="large"
                  />
                </div>
              </motion.div>

              {/* Footer text */}
              <motion.p 
                variants={itemVariants}
                className="text-white/30 text-[11px] text-center leading-relaxed mt-8 font-medium"
              >
                O seu primeiro acesso passará por pendência<br />
                de aprovação da administração.
              </motion.p>
            </motion.div>

            {/* Créditos no rodapé da página */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.8 }}
               className="mt-6 flex flex-col items-center justify-center gap-1 opacity-40 hover:opacity-80 transition-opacity duration-300"
            >
              <p className="text-[9px] text-white font-medium uppercase tracking-[0.2em]">
                Secretaria Municipal de Saúde
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
