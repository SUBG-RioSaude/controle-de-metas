export type EtapaStatus =
  | "Não Iniciada"
  | "Em Andamento"
  | "Concluída"
  | "Documento Gerado"
  | "Aguardando retorno da área";

export interface PlanoDeAcao {
  id: string;
  code: string;
  title: string;
  description: string;
  area: string;
  created_at: string;
}

export interface Etapa {
  id: string;
  plan_id: string;
  topico_id: string;
  step_number: number;
  description: string;
  tema: string;
  relacao_direta: string;
  area: string;
  prazo: string;
  status: EtapaStatus;
  documento_comprobatorio: string;
  drive_link: string;
  created_at: string;
}

export const STATUS_COLORS: Record<EtapaStatus, string> = {
  Concluída: "status-concluida",
  "Em Andamento": "status-em-andamento",
  "Não Iniciada": "status-nao-iniciada",
  "Documento Gerado": "status-documento",
  "Aguardando retorno da área": "status-aguardando",
};

export const STATUS_LIST: EtapaStatus[] = [
  "Não Iniciada",
  "Em Andamento",
  "Concluída",
  "Documento Gerado",
  "Aguardando retorno da área",
];

// ── API de Stats ─────────────────────────────────────────────────────────────

export interface ApiOverviewStats {
  totalMetas: number;
  percentualConcluidas: number;
  naoIniciadas: number;
  emAndamento: number;
  pendentesAprovacao: number;
  concluidas: number;
  aguardandoRetorno: number;
}

// ── API de Setores ────────────────────────────────────────────────────────────

export interface ApiSetor {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

// ── API de Metas ─────────────────────────────────────────────────────────────

export type MetaStatus = "NaoIniciada" | "EmAndamento" | "Concluida" | "DocumentoGerado" | "AguardandoRetorno";

export interface ApiMeta {
  id: string;
  topicoId: string;
  descricao: string;
  status: MetaStatus;
  documentUrl: string | null;
  approverComment: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTopico {
  id: string;
  temaId: string;
  descricao: string;
  setorId: string | null;
  setorNome: string | null;
  pontosFocais: string[];
  createdAt: string;
  updatedAt: string;
  metas: ApiMeta[];
}

export interface ApiTema {
  id: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
  topicos: ApiTopico[];
}

// ── API de Marcos ─────────────────────────────────────────────────────────────

export interface ApiMarco {
  id: string;
  etapa: string;
  responsaveis: string[];
  prazo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export const META_STATUS_CONFIG: Record<MetaStatus, { label: string; color: string; bg: string; dot: string }> = {
  NaoIniciada:       { label: "Não Iniciada",      color: "text-white/40",    bg: "bg-white/[0.06] border-white/10",         dot: "bg-white/30" },
  EmAndamento:       { label: "Em Andamento",       color: "text-yellow-300",  bg: "bg-yellow-300/10 border-yellow-300/20",   dot: "bg-yellow-300" },
  Concluida:         { label: "Concluída",          color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400" },
  DocumentoGerado:   { label: "Documento Gerado",   color: "text-[#42b9eb]",   bg: "bg-[#42b9eb]/10 border-[#42b9eb]/20",    dot: "bg-[#42b9eb]" },
  AguardandoRetorno: { label: "Aguardando Retorno", color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20",  dot: "bg-orange-400" },
};

// ── API de Dashboard ──────────────────────────────────────────────────────────

export interface ApiDashboardEvolucaoMensal {
  mes: string;
  naoIniciadas: number;
  emAndamento: number;
  pendentesAprovacao: number;
  concluidas: number;
  aguardandoRetorno: number;
}

export interface ApiDashboardCalendarioMeta {
  id: string;
  descricao: string;
  status: MetaStatus;
  data: string;
}

export interface ApiDashboardVisaoCalendario {
  mes: string;
  concluidas: number;
  emAndamento: number;
  naoIniciadas: number;
  aguardando: number;
  documentosGerados: number;
  metas: ApiDashboardCalendarioMeta[];
}

export interface ApiDashboardStats {
  metricas: {
    totalMetas: number;
    percentualConcluidas: number;
    naoIniciadas: number;
    emAndamento: number;
    pendentesAprovacao: number;
    concluidas: number;
    aguardandoRetorno: number;
    documentosUploaded: number;
    documentosAprovados: number;
    documentosAguardandoRevisao: number;
    documentosComAlteracoesSolicitadas: number;
  };
  setores: { id: string; nome: string }[];
  marcos: { id: string; titulo: string; descricao: string; dataMarco: string }[];
  evolucaoMensal: ApiDashboardEvolucaoMensal[];
  visaoCalendario: ApiDashboardVisaoCalendario[];
}
