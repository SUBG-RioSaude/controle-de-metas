import type { ApiTema, ApiTopico } from "./types";
import { getMetasBase } from "./metas-api";

// Os endpoints devolvem apenas documentos oficiais (aprovados) — os mesmos já
// listados em `documentosAprovados`. Nomenclatura: o que a interface chama de
// "Meta" é o Tópico da API; o que ela chama de "objetivo" é a Meta da API.

/** ZIP com os documentos oficiais de todos os temas, um diretório por tema. */
export function urlDownloadTodosTemas(): string {
  return `${getMetasBase()}/downloads/temas`;
}

/** ZIP com os documentos oficiais de um tema, um diretório por meta. */
export function urlDownloadTema(temaId: string): string {
  return `${getMetasBase()}/downloads/temas/${temaId}`;
}

/** ZIP com os documentos oficiais de uma única meta (Tópico na API). */
export function urlDownloadMeta(topicoId: string): string {
  return `${getMetasBase()}/downloads/topicos/${topicoId}`;
}

/** Arquivo individual, com o nome original. */
export function urlDownloadDocumento(docId: string): string {
  return `${getMetasBase()}/downloads/documentos/${docId}`;
}

/** Quantos documentos oficiais o tema tem — usado para desabilitar o botão quando não há nada a baixar. */
export function totalDocumentosDoTema(tema: ApiTema): number {
  return tema.topicos.reduce((acc, t) => acc + t.documentosAprovados.length, 0);
}

/** Idem, para a lista completa de temas. */
export function totalDocumentosDosTemas(temas: ApiTema[]): number {
  return temas.reduce((acc, tema) => acc + totalDocumentosDoTema(tema), 0);
}

/** Quantos documentos oficiais uma meta (Tópico) tem. */
export function totalDocumentosDaMeta(topico: ApiTopico): number {
  return topico.documentosAprovados.length;
}

/**
 * Dispara o download sem sair da página. Em URL cross-origin o atributo `download`
 * é ignorado pelo browser — quem manda o arquivo para o disco em vez de navegar
 * é o `Content-Disposition: attachment` devolvido pela API.
 */
export function dispararDownload(url: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
