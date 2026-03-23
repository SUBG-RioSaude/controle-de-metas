import type { ApiTema, ApiSetor, ApiOverviewStats, ApiMarco, ApiResponse } from "./types";

const getMetasBase = () => {
  if (typeof window !== "undefined") {
    return window.__ENV__?.NEXT_PUBLIC_METAS_API || process.env.NEXT_PUBLIC_METAS_API;
  }
  return process.env.NEXT_PUBLIC_METAS_API;
};

// Exportar funções usando a URL dinâmica

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
