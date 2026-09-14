import type { ApiTema, ApiSetor, ApiOverviewStats, ApiMarco, ApiResponse, ApiDashboardStats } from "./types";

// Indirect access prevents Next.js/SWC from inlining at build time.
function runtimeEnv(key: string): string | undefined {
  return process.env[key];
}

export const getMetasBase = () => {
  const base =
    typeof window === "undefined"
      ? runtimeEnv('NEXT_PUBLIC_METAS_API')
      : window.__ENV__?.NEXT_PUBLIC_METAS_API || "";
  // Remove barra(s) finais para evitar "//temas" ao concatenar o path do endpoint.
  return (base ?? "").replace(/\/+$/, "");
};


export async function getTemas(): Promise<ApiTema[]> {
  const res = await fetch(`${getMetasBase()}/temas`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const json: ApiResponse<ApiTema[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Erro ao buscar temas");
  return json.data;
}

export async function getOverviewStats(): Promise<ApiOverviewStats> {
  const res = await fetch(`${getMetasBase()}/stats/overview`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const json: ApiResponse<ApiOverviewStats> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Erro ao buscar estatísticas");
  return json.data;
}

export async function getMarcos(): Promise<ApiMarco[]> {
  const res = await fetch(`${getMetasBase()}/marcos`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const json: ApiResponse<ApiMarco[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Erro ao buscar marcos");
  return json.data;
}

export async function getSetores(): Promise<ApiSetor[]> {
  const res = await fetch(`${getMetasBase()}/setores`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const json: ApiResponse<ApiSetor[]> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Erro ao buscar setores");
  return json.data;
}

export async function getDashboardStats(): Promise<ApiDashboardStats> {
  const res = await fetch(`${getMetasBase()}/stats/dashboard`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const json: ApiResponse<ApiDashboardStats> = await res.json();
  if (!json.success) throw new Error(json.error ?? "Erro ao buscar estatísticas do dashboard");
  return json.data;
}
