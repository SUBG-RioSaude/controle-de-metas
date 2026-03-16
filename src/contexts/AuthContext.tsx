"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import * as signalR from "@microsoft/signalr";
import { AuthUser, Role, getUser, saveAuth, clearAuth, updateRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const router = useRouter();

  // Hydrate from cookies on mount
  useEffect(() => {
    const stored = getUser();
    if (stored) setUserState(stored);
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    if (u) saveAuth(u);
    else clearAuth();
  }, []);

  const logout = useCallback(() => {
    connectionRef.current?.stop();
    connectionRef.current = null;
    clearAuth();
    setUserState(null);
    router.push("/login");
  }, [router]);

  // ── SignalR: connect when user is set, disconnect on logout ──────────────────
  useEffect(() => {
    if (!user?.token) {
      connectionRef.current?.stop();
      connectionRef.current = null;
      return;
    }

    // Avoid duplicate connections
    if (connectionRef.current) return;

    const hub = process.env.NEXT_PUBLIC_AUTH_API;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hub}/hubs/role`, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Role updated by admin → update local state in real time
    connection.on("UserRoleChanged", ({ userId, newRole }: { userId: string; newRole: Role }) => {
      if (userId !== user.userId) return;
      updateRole(newRole);
      setUserState((prev) => prev ? { ...prev, role: newRole } : prev);
    });

    connection.start().catch((err) => {
      console.error("[SignalR] Connection failed:", err);
    });

    connectionRef.current = connection;

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [user?.token, user?.userId]);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
