"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user }          = useAuth();
  const router            = useRouter();
  const [ready, setReady] = useState(false);

  // Wait one tick so AuthContext can hydrate from cookies before we decide
  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role === "Pending") {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role === "Pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
