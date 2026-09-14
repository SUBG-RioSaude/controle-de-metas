"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GoogleOAuthProvider clientId={(typeof window !== "undefined" && window.__ENV__?.NEXT_PUBLIC_METAS_GOOGLE_CLIENT_ID) || process.env['NEXT_PUBLIC_METAS_GOOGLE_CLIENT_ID'] || ""}>
      <QueryClientProvider client={queryClient}>
        {/* Sem ThemeProvider: o tema é fixo em dark, via <html className="dark">. */}
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            {children}
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}