// ── Auth helpers — cookie-based ───────────────────────────────────────────────
import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

// 7 days — matches backend JWT expiry
const COOKIE_OPTS: Cookies.CookieAttributes = { expires: 7, sameSite: "Lax" };

export type Role = "Pending" | "Visualizador" | "Analista" | "Aprovador" | "Admin";

export const ROLE_ENUM: Record<Role, number> = {
  Pending: 0,
  Visualizador: 1,
  Analista: 2,
  Aprovador: 3,
  Admin: 4,
};

export interface AuthUser {
  token:   string;
  userId:  string;
  name:    string;
  email:   string;
  picture: string;
  role:    Role;
}

// ── Storage (cookies) ─────────────────────────────────────────────────────────

export function saveAuth(user: AuthUser): void {
  Cookies.set(TOKEN_KEY, user.token,          COOKIE_OPTS);
  Cookies.set(USER_KEY,  JSON.stringify(user), COOKIE_OPTS);
}

export function updateRole(role: Role): void {
  const user = getUser();
  if (!user) return;
  user.role = role;
  Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTS);
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Indirect access prevents Next.js/SWC from inlining at build time.
function runtimeEnv(key: string): string | undefined {
  return process.env[key];
}

// ── API login call (plain fetch — before Axios is configured) ─────────────────

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const base = (typeof window !== "undefined" && window.__ENV__?.NEXT_PUBLIC_AUTH_API)
    || runtimeEnv('NEXT_PUBLIC_AUTH_API');
  const res  = await fetch(`${base}/auth/google`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ idToken }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Falha na autenticação.");
  }
  return json.data as AuthUser;
}
