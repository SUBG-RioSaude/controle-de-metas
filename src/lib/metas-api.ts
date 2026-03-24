import type { ApiTema, ApiSetor, ApiOverviewStats, ApiMarco, ApiResponse, ApiDashboardStats } from "./types";

// Para chamadas server-side (Server Components), usamos a variável sem NEXT_PUBLIC_
// pois o Portainer injeta corretamente no Node em runtime.
// Para chamadas client-side (improvável neste arquivo), cai no window.__ENV__.
const getMetasBase = () => {
  // Server-side: process.env.NEXT_PUBLIC_METAS_API é lido diretamente do Portainer em runtime
  if (typeof window === "undefined") {
    // Server-side: bracket notation impede o Next.js de inlinear no build → lê do Portainer em runtime
    return process.env['NEXT_PUBLIC_METAS_API'];
  }
  // Client-side: usa o window.__ENV__ injetado pelo layout.tsx
  return window.__ENV__?.NEXT_PUBLIC_METAS_API || process.env.NEXT_PUBLIC_METAS_API;
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
