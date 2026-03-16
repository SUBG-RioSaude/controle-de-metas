"use client";

import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { loginWithGoogle, AuthUser } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

const CROSSES = [
  { size: 28, top: "8%",  left: "4%",  opacity: 0.08 },
  { size: 14, top: "20%", left: "80%", opacity: 0.06 },
  { size: 20, top: "70%", left: "6%",  opacity: 0.07 },
  { size: 12, top: "55%", left: "90%", opacity: 0.09 },
  { size: 22, top: "88%", left: "50%", opacity: 0.06 },
  { size: 16, top: "35%", left: "70%", opacity: 0.05 },
];

export function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      toast.error("Não foi possível obter as credenciais do Google.");
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      setUser(user); // saves to cookie + updates global context

      if (user.role === "Pending") {
        setPendingUser(user);
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Detect if there's already a pending user in context
  const { user: authUser } = useAuth();
  useEffect(() => {
    if (authUser?.role === "Pending") {
      setPendingUser(authUser);
    }
  }, [authUser]);


  if (pendingUser) {
    return <PendingApprovalScreen user={pendingUser} />;
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#13335a" }}
    >
      {/* Aurora blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full opacity-[0.20]"
          style={{ background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="absolute top-[10%] right-0 w-[55%] h-[55%] rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, #2a688f 0%, transparent 70%)", filter: "blur(90px)" }}
        />
        <div
          className="absolute bottom-0 left-[20%] w-[50%] h-[50%] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #42b9eb 0%, transparent 70%)", filter: "blur(100px)" }}
        />
      </div>

      {/* Decorative crosses */}
      {CROSSES.map(({ size, top, left, opacity }, i) => (
        <motion.svg
          key={i}
          width={size} height={size} viewBox="0 0 24 24"
          className="absolute pointer-events-none"
          style={{ top, left, opacity }}
          aria-hidden
          animate={{ y: [0, i % 2 === 0 ? 16 : -16, 0], x: [0, i % 3 === 0 ? 10 : -10, 0] }}
          transition={{ duration: 14 + i * 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="10" y="1" width="4" height="22" fill="white" rx="1" />
          <rect x="1" y="10" width="22" height="4" fill="white" rx="1" />
        </motion.svg>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col items-center gap-7">
          
          {/* Back to Home */}
          <button 
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors text-[10px] font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={12} />
            Início
          </button>

          {/* Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-4"
          >
            <Image src="/brand/logobranca.png" alt="SMS Rio" width={110} height={30} className="object-contain" priority />
            <div className="w-px h-7 bg-white/15" />
            <Image src="/brand/tcmrio-logo.png" alt="TCMRio" width={80} height={22} className="object-contain" />
          </motion.div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10" />

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-center flex flex-col gap-1.5"
          >
            <h1 className="text-white font-bold text-2xl tracking-tight">
              Controle de Metas
            </h1>
            <p className="text-white/45 text-sm leading-relaxed">
              Acesse com sua conta Google institucional
            </p>
          </motion.div>

          {/* Google button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full flex justify-center"
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error("Login com Google cancelado ou falhou.");
                setLoading(false);
              }}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="100%"
            />
          </motion.div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/25 text-xs text-center leading-relaxed"
          >
            Use seu e-mail institucional.<br />
            Novos usuários ficam pendentes de aprovação.
          </motion.p>
        </div>

        {/* Bottom badge */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-center text-white/20 text-[11px] mt-4"
        >
          Secretaria Municipal de Saúde · TCMRio 2025
        </motion.p>
      </motion.div>
    </div>
  );
}
