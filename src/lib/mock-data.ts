import { PlanoDeAcao, Etapa } from "./types";

export interface Marco {
  id: string;
  date: string;
  dateLabel: string;
  title: string;
  description: string;
}

export const marcos: Marco[] = [
  {
    id: "m1",
    date: "2026-04-03",
    dateLabel: "03 de abril de 2026",
    title: "Documento Preliminar",
    description: "Entrega de documento preliminar contendo as ações já realizadas pela SMS.",
  },
  {
    id: "m2",
    date: "2026-04-17",
    dateLabel: "17 de abril de 2026",
    title: "Matriz SWOT",
    description: "Entrega de documento com Matriz SWOT das metas.",
  },
  {
    id: "m3",
    date: "2026-04-24",
    dateLabel: "20 a 24 de abril de 2026",
    title: "Reuniões Conjuntas",
    description: "Reuniões conjuntas para discussão da Matriz SWOT entre os setores responsáveis, o TCMRio e a CGM-Rio.",
  },
  {
    id: "m4",
    date: "2026-07-03",
    dateLabel: "03 de julho de 2026",
    title: "Relatório Final",
    description: "Envio de relatório final das metas.",
  },
  {
    id: "m5",
    date: "2026-08-24",
    dateLabel: "24 de agosto de 2026",
    title: "Encerramento do Monitoramento",
    description: "Término do período de monitoramento. Data final para apresentação de documentos e argumentos complementares por meio de relatório consolidado.",
  },
];

export const planos: PlanoDeAcao[] = [
  { id: "1", code: "PA01", title: "Contratações Diretas", description: "Promover medidas mitigatórias de forma a reduzir a ocorrência de contratações diretas, de forma emergencial, sem as devidas exigências e/ou conformidades legais.", area: "DAF, NPC", created_at: "2025-01-10" },
  { id: "2", code: "PA02", title: "Gestão de Pessoal", description: "Aprimorar os processos de gestão de pessoal, garantindo conformidade e eficiência nos procedimentos administrativos.", area: "RH", created_at: "2025-01-10" },
  { id: "3", code: "PA03", title: "Controle de Almoxarifado", description: "Implementar sistema de controle de almoxarifado com rastreabilidade e inventário periódico.", area: "NGMC, DOP", created_at: "2025-01-15" },
  { id: "4", code: "PA04", title: "Prestação de Contas", description: "Garantir a tempestividade e conformidade das prestações de contas dos convênios e contratos.", area: "DAF", created_at: "2025-01-20" },
  { id: "5", code: "PA05", title: "Infraestrutura Tecnológica", description: "Modernizar a infraestrutura tecnológica das unidades de saúde.", area: "TI", created_at: "2025-02-01" },
];

const generateEtapas = (): Etapa[] => {
  const statuses: Etapa["status"][] = ["Concluída", "Concluída", "Concluída", "Documento Gerado", "Em Andamento", "Não Iniciada", "Aguardando retorno da área", "Concluída", "Documento Gerado", "Concluída"];
  const etapas: Etapa[] = [];
  let id = 1;

  planos.forEach((plan, planIdx) => {
    // Generate a fixed number of steps per plan based on its ID
    const count = 4 + (parseInt(plan.id) % 3); 
    for (let i = 1; i <= count; i++) {
      // Deterministic dates based on plan and step index
      const month = String(((planIdx + i) % 12) + 1).padStart(2, "0");
      const day = String(((planIdx * 5 + i * 3) % 28) + 1).padStart(2, "0");
      const st = statuses[(id - 1) % statuses.length];
      etapas.push({
        id: String(id),
        plan_id: plan.id,
        step_number: i,
        description: `Etapa ${i} do plano ${plan.code} — ${["Elaborar documentação", "Realizar levantamento", "Implementar controle", "Validar conformidade", "Publicar relatório", "Capacitar equipe", "Mapear processos"][i % 7]}`,
        tema: `${i} – ${plan.title}`,
        relacao_direta: plan.code,
        area: plan.area,
        prazo: `2025-${month}-${day}`,
        status: st,
        documento_comprobatorio: st === "Concluída" || st === "Documento Gerado" ? "Documento Gerado" : "",
        drive_link: st === "Concluída" || st === "Documento Gerado" ? `https://drive.google.com/file/d/example${id}` : "",
        created_at: plan.created_at,
      });
      id++;
    }
  });
  return etapas;
};

export const etapas: Etapa[] = generateEtapas();
