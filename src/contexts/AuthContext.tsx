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
import { AuthUser, Role, getUser, saveAuth, clearAuth } from "@/lib/auth";
import api from "@/lib/api";
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
  // useRef to avoid stale closure — always holds the latest userId
  const userIdRef = useRef<string | null>(null);
  const router = useRouter();

  // Hydrate from cookies on mount
  useEffect(() => {
    const stored = getUser();
    if (stored) setUserState(stored);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    userIdRef.current = user?.userId ?? null;
  }, [user?.userId]);

  const setUser = useCallback((u: AuthUser | null) => {
    if (u) saveAuth(u);
    else clearAuth();
    setUserState(u);
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

    const hub = window.__ENV__?.NEXT_PUBLIC_AUTH_API || "";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hub}/hubs/role`, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Role updated by admin → update local state in real time
    // Uses userIdRef to avoid stale closure on user.userId
    // Listening for BOTH casing variants:
    //   "UserRoleChanged" = Newtonsoft.Json default (PascalCase)
    //   "userRoleChanged" = System.Text.Json default (camelCase)
    const handleRoleChanged = async ({ userId, newRole }: { userId: string; newRole: Role }) => {
      console.log("[SignalR] RoleChanged received:", { userId, newRole, currentUserId: userIdRef.current });
      if (userId !== userIdRef.current) {
        return;
      }

      // 1. Small delay to ensure backend has finished the DB transaction
      await new Promise(r => setTimeout(r, 1000));

      try {
        const response = await api.post("/auth/refresh");

        if (response.data.success) {
          const updatedUser = response.data.data as AuthUser;
          console.log("[SignalR] Token refreshed successfully:", updatedUser.role);
          setUser(updatedUser);
        } else {
          console.warn("[SignalR] Refresh endpoint returned success:false", response.data.error);
          if (user) setUser({ ...user, role: newRole });
        }
      } catch (err: any) {
        console.error("[SignalR] Error during token refresh:", err.response?.status, err.response?.data || err.message);
        // Fallback: persiste no cookie para sobreviver a reloads de página
        if (user) setUser({ ...user, role: newRole });
      }
    };

    connection.on("UserRoleChanged", handleRoleChanged); // PascalCase
    connection.on("userRoleChanged", handleRoleChanged); // camelCase

    connection.start()
      .then(() => {
        console.log("[SignalR] Connected | connectionId:", connection.connectionId);
        console.log("[SignalR] Listening as userId:", userIdRef.current);
      })
      .catch((err) => console.error("[SignalR] Connection failed:", err));

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
